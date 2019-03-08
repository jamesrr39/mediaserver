package dal

import (
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log"
	"mediaserverapp/mediaserver/dal/picturesmetadatacache"
	"mediaserverapp/mediaserver/dal/videodal"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/mediaserverjobs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logger"
	"github.com/jamesrr39/goutil/profile"
	"github.com/jamesrr39/semaphore"
)

type getRecordsInTrackFuncType func(trackSummary *domain.FitFileSummary) (domain.Records, error)

type MediaFilesDAL struct {
	log              *logger.Logger
	fs               gofs.Fs
	picturesBasePath string
	cache            *picturesmetadatacache.MediaFilesCache
	thumbnailsDAL    *ThumbnailsDAL
	videosDAL        videodal.VideoDAL
	picturesDAL      *PicturesDAL
	jobRunner        *mediaserverjobs.JobRunner
	tracksDAL        *TracksDAL
}

func NewMediaFilesDAL(log *logger.Logger, fs gofs.Fs, picturesBasePath string, thumbnailsDAL *ThumbnailsDAL, videosDAL videodal.VideoDAL, picturesDAL *PicturesDAL, jobRunner *mediaserverjobs.JobRunner, tracksDAL *TracksDAL) *MediaFilesDAL {
	return &MediaFilesDAL{log, fs, picturesBasePath, picturesmetadatacache.NewMediaFilesCache(), thumbnailsDAL, videosDAL, picturesDAL, jobRunner, tracksDAL}
}

func (dal *MediaFilesDAL) GetAll() []domain.MediaFile {
	return dal.cache.GetAll()
}

// GetStateHashCode returns a hash that identifies the cache's current state
// TODO: is this needed?
func (dal *MediaFilesDAL) GetStateHashCode() domain.HashValue {
	return dal.cache.GetHashValue()
}

func (dal *MediaFilesDAL) add(mediaFile domain.MediaFile) error {
	return dal.cache.Add(mediaFile)
}

// Get returns the picture metadata for a given hash. If the hash is not found, nil will be returned.
func (dal *MediaFilesDAL) Get(hashValue domain.HashValue) domain.MediaFile {
	return dal.cache.Get(hashValue)
}

func (dal *MediaFilesDAL) OpenFile(mediaFile domain.MediaFile) (gofs.File, error) {
	return dal.fs.Open(filepath.Join(dal.picturesBasePath, mediaFile.GetMediaFileInfo().RelativePath))
}

func (dal *MediaFilesDAL) processFitFile(tx *sql.Tx, path string, fileInfo os.FileInfo) (*domain.FitFileSummary, error) {
	file, err := dal.fs.Open(path)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	mediaFileInfo := domain.NewMediaFileInfo(relativePath, hashValue, domain.MediaFileTypeFitTrack, fileInfo.Size())

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return domain.NewFitFileSummaryFromReader(mediaFileInfo, file)
}

func (dal *MediaFilesDAL) processVideoFile(tx *sql.Tx, path string, fileInfo os.FileInfo) (*domain.VideoFileMetadata, error) {

	file, err := dal.fs.Open(path)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	videoFileMetadata := domain.NewVideoFileMetadata(hashValue, relativePath, fileInfo.Size())

	err = dal.videosDAL.EnsureSupportedFile(videoFileMetadata)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return videoFileMetadata, nil
}

func (dal *MediaFilesDAL) processPictureFile(tx *sql.Tx, path string, profileRun *profile.Run) (*domain.PictureMetadata, error) {
	var err error
	var file gofs.File

	profileRun.Measure("open file", func() {
		file, err = dal.fs.Open(path)
	})
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	var hash domain.HashValue
	profileRun.Measure("calculate file hash", func() {
		hash, err = domain.NewHash(file)
	})
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	var pictureMetadata *domain.PictureMetadata
	profileRun.Measure("get metadata from db", func() {
		pictureMetadata, err = dal.picturesDAL.GetPictureMetadata(tx, hash, relativePath)
	})
	if nil != err {
		if err != ErrNotFound {
			return nil, fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", relativePath, err)
		}
		profileRun.Measure("read picture metadata and picture", func() {
			pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(file, relativePath, hash)
		})
		if nil != err {
			return nil, errorsx.Wrap(err)
		}

		profileRun.Measure("write picture metadata", func() {
			err = dal.picturesDAL.CreatePictureMetadata(tx, pictureMetadata)
		})
		if nil != err {
			return nil, fmt.Errorf("unexpected error setting picture metadata to database for relative file path '%s': '%s'", relativePath, err)
		}
	}

	return pictureMetadata, nil
}

func (dal *MediaFilesDAL) UpdatePicturesCache(tx *sql.Tx, profileRun *profile.Run) errorsx.Error {
	sema := semaphore.NewSemaphore(uint(runtime.NumCPU()))

	var mediaFiles []domain.MediaFile
	var errs []error

	mediaFileChan := make(chan domain.MediaFile)
	go func() {
		for {
			mediaFile := <-mediaFileChan
			mediaFiles = append(mediaFiles, mediaFile)
		}
	}()

	errChan := make(chan error)
	go func() {
		for {
			err := <-errChan
			errs = append(errs, err)
		}
	}()

	walkFunc := func(path string, fileInfo os.FileInfo, err error) error {
		if nil != err {
			return errorsx.Wrap(err)
		}

		if fileInfo.IsDir() {
			// skip
			return nil
		}

		sema.Add()
		go func() {
			defer sema.Done()
			mediaFile, err := dal.processFile(dal.fs, profileRun, tx, path, fileInfo)
			if err != nil {
				if err == ErrFileNotSupported {
					log.Println("skipping " + path + ", file extension not recognised")
					return
				}
				errChan <- err
				return
			}

			mediaFileChan <- mediaFile
		}()
		return nil
	}

	err := gofs.Walk(dal.fs, dal.picturesBasePath, walkFunc, gofs.WalkOptions{FollowSymlinks: true})
	if nil != err {
		return errorsx.Wrap(err)
	}

	sema.Wait()

	if len(errs) > 0 {
		var errTexts []string
		for _, err := range errs {
			errTexts = append(errTexts, fmt.Sprintf("%q", err))
		}
		return errorsx.Errorf("errors reading files: %s", strings.Join(errTexts, ", "))
	}

	newCache := picturesmetadatacache.NewMediaFilesCache()
	newCache.AddBatch(mediaFiles...)
	var mu sync.Mutex
	mu.Lock()
	dal.cache = newCache
	mu.Unlock()
	return nil
}

func (dal *MediaFilesDAL) QueueSuggestedLocationJob() {
	var picturesMetadatas []*domain.PictureMetadata
	var trackSummaries []*domain.FitFileSummary

	for _, mediaFile := range dal.GetAll() {
		switch mediaFile.GetMediaFileInfo().MediaFileType {
		case domain.MediaFileTypePicture:
			picturesMetadatas = append(picturesMetadatas, mediaFile.(*domain.PictureMetadata))
		case domain.MediaFileTypeFitTrack:
			trackSummaries = append(trackSummaries, mediaFile.(*domain.FitFileSummary))
		}
	}

	var setLocationsOnPictureFunc = func(pictureMetadata *domain.PictureMetadata, suggestedLocation domain.LocationSuggestion) errorsx.Error {
		pm := dal.Get(pictureMetadata.HashValue).(*domain.PictureMetadata)
		pm.SuggestedLocation = &suggestedLocation
		dal.log.Info("set suggested location on %s", pictureMetadata.HashValue)
		return nil
	}

	dal.jobRunner.QueueJob(mediaserverjobs.NewApproximateLocationsJob(
		picturesMetadatas,
		trackSummaries,
		dal.tracksDAL.GetRecords,
		setLocationsOnPictureFunc,
	))
}

func (dal *MediaFilesDAL) processFile(fs gofs.Fs, profileRun *profile.Run, tx *sql.Tx, path string, fileInfo os.FileInfo) (domain.MediaFile, error) {
	var mediaFile domain.MediaFile
	var err error

	fileExtensionLower := strings.ToLower(filepath.Ext(path))
	switch fileExtensionLower {
	case ".jpg", ".jpeg", ".png":
		profileRun.Measure("process picture file", func() {
			mediaFile, err = dal.processPictureFile(tx, path, profileRun)
		})
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	case ".mp4":
		profileRun.Measure("process video file", func() {
			mediaFile, err = dal.processVideoFile(tx, path, fileInfo)
		})
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	case ".fit":
		profileRun.Measure("process fit file", func() {
			mediaFile, err = dal.processFitFile(tx, path, fileInfo)
		})
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	default:
		return nil, ErrFileNotSupported
	}

	return mediaFile, nil
}

var ErrFileNotSupported = errors.New("file not supported")
