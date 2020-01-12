package dal

import (
	"database/sql"
	"errors"
	"fmt"
	"io"
	"mediaserver/mediaserver/dal/picturesmetadatacache"
	"mediaserver/mediaserver/dal/videodal"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/mediaserverjobs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
	"github.com/jamesrr39/semaphore"
)

type MediaFileUpdateProperty int64

const (
	MediaFileUpdatePropertyUnknown MediaFileUpdateProperty = iota
	MediaFileUpdatePropertyParticipantIDs
)

var ErrFileNotSupported = errors.New("file not supported")

type getRecordsInTrackFuncType func(trackSummary *domain.FitFileSummary) (domain.Records, error)

type MediaFilesDAL struct {
	log              *logpkg.Logger
	fs               gofs.Fs
	picturesBasePath string
	cache            *picturesmetadatacache.MediaFilesCache
	thumbnailsDAL    *ThumbnailsDAL
	videosDAL        videodal.VideoDAL
	picturesDAL      *PicturesDAL
	jobRunner        *mediaserverjobs.JobRunner
	tracksDAL        *TracksDAL
	peopleDAL        *PeopleDAL
}

func NewMediaFilesDAL(log *logpkg.Logger, fs gofs.Fs, picturesBasePath string, thumbnailsDAL *ThumbnailsDAL, videosDAL videodal.VideoDAL, picturesDAL *PicturesDAL, jobRunner *mediaserverjobs.JobRunner, tracksDAL *TracksDAL, peopleDAL *PeopleDAL) *MediaFilesDAL {
	return &MediaFilesDAL{log, fs, picturesBasePath, picturesmetadatacache.NewMediaFilesCache(), thumbnailsDAL, videosDAL, picturesDAL, jobRunner, tracksDAL, peopleDAL}
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

func (dal *MediaFilesDAL) processFitFile(tx *sql.Tx, mediaFileInfo domain.MediaFileInfo, file io.Reader) (*domain.FitFileSummary, error) {
	return domain.NewFitFileSummaryFromReader(mediaFileInfo, file)
}

func (dal *MediaFilesDAL) processVideoFile(tx *sql.Tx, mediaFileInfo domain.MediaFileInfo) (*domain.VideoFileMetadata, error) {
	videoFileMetadata := domain.NewVideoFileMetadata(mediaFileInfo)

	err := dal.videosDAL.EnsureSupportedFile(videoFileMetadata)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return videoFileMetadata, nil
}

func (dal *MediaFilesDAL) GetFullPath(relativePath string) string {
	return filepath.Join(dal.picturesBasePath, relativePath)
}

func (dal *MediaFilesDAL) processPictureFile(tx *sql.Tx, mediaFileInfo domain.MediaFileInfo, profileRun *profile.Run) (*domain.PictureMetadata, error) {
	file, err := dal.fs.Open(dal.GetFullPath(mediaFileInfo.RelativePath))
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	getMetadataMeasurement := profileRun.Measure("get metadata from db")
	pictureMetadata, err := dal.picturesDAL.GetPictureMetadata(tx, mediaFileInfo)
	if nil != err {
		if err != ErrNotFound {
			return nil, fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", mediaFileInfo.RelativePath, err)
		}

		getMetadataMeasurement.MeasureStep("read picture metadata and picture: ")
		pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(file, mediaFileInfo)
		if nil != err {
			return nil, errorsx.Wrap(err)
		}

		getMetadataMeasurement.MeasureStep("write picture metadata")
		err = dal.picturesDAL.CreatePictureMetadata(tx, pictureMetadata)
		if nil != err {
			return nil, fmt.Errorf("unexpected error setting picture metadata to database for relative file path '%s': '%s'", mediaFileInfo.RelativePath, err)
		}
	}

	return pictureMetadata, nil
}

func (dal *MediaFilesDAL) UpdatePicturesCache(tx *sql.Tx, profileRun *profile.Run) errorsx.Error {
	sema := semaphore.NewSemaphore(uint(runtime.NumCPU()))

	var mediaFiles []domain.MediaFile

	mediaFileChan := make(chan domain.MediaFile)
	go func() {
		for {
			mediaFile := <-mediaFileChan
			mediaFiles = append(mediaFiles, mediaFile)
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
					dal.log.Info("skipping " + path + ", file extension not recognised")
					return
				}
				dal.log.Warn("couldn't process file %q: %s", path, err)
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

func (dal *MediaFilesDAL) Update(tx *sql.Tx, mediaFile domain.MediaFile, properties ...MediaFileUpdateProperty) errorsx.Error {
	if len(properties) == 0 {
		return errorsx.Errorf("update: expected at least 1 property to update")
	}

	existingFile := dal.Get(mediaFile.GetMediaFileInfo().HashValue)

	if existingFile == nil {
		return errorsx.Wrap(os.ErrNotExist)
	}

	_, err := tx.Exec(`DELETE FROM people_mediafiles WHERE mediafile_hash = $1`, mediaFile.GetMediaFileInfo().HashValue)
	if err != nil {
		return errorsx.Wrap(err)
	}

	for _, participantID := range mediaFile.GetMediaFileInfo().ParticipantIDs {
		_, err := tx.Exec(`INSERT INTO people_mediafiles (person_id, mediafile_hash) VALUES ($1, $2)`, participantID, mediaFile.GetMediaFileInfo().HashValue)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}

	for _, property := range properties {
		switch property {
		case MediaFileUpdatePropertyParticipantIDs:
			switch mFile := existingFile.(type) {
			case *domain.PictureMetadata:
				mFile.ParticipantIDs = mediaFile.GetMediaFileInfo().ParticipantIDs
			case *domain.VideoFileMetadata:
				mFile.ParticipantIDs = mediaFile.GetMediaFileInfo().ParticipantIDs
			case *domain.FitFileSummary:
				mFile.ParticipantIDs = mediaFile.GetMediaFileInfo().ParticipantIDs
			default:
				return errorsx.Errorf("unknown file type for mediafile: %T", mFile)
			}
		default:
			return errorsx.Errorf("unrecognised property: %q", property)
		}
	}

	return nil
}

func (dal *MediaFilesDAL) processFile(fs gofs.Fs, profileRun *profile.Run, tx *sql.Tx, path string, fileInfo os.FileInfo) (domain.MediaFile, error) {
	var mediaFile domain.MediaFile
	var err error

	file, err := dal.fs.Open(path)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	osFileInfo, err := dal.fs.Stat(path)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hash, err := domain.NewHash(file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	participantIDs, err := dal.peopleDAL.GetPeopleIDsInMediaFile(tx, hash)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	fileType := domain.GetFileTypeFromPath(path)

	mediaFileInfo := domain.NewMediaFileInfo(relativePath, hash, fileType, osFileInfo.Size(), participantIDs, osFileInfo.ModTime(), osFileInfo.Mode())

	switch fileType {
	case domain.MediaFileTypePicture:
		profileRun.Measure("process picture file")
		mediaFile, err = dal.processPictureFile(tx, mediaFileInfo, profileRun)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	case domain.MediaFileTypeVideo:
		profileRun.Measure("process video file")
		mediaFile, err = dal.processVideoFile(tx, mediaFileInfo)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	case domain.MediaFileTypeFitTrack:
		profileRun.Measure("process fit file")
		mediaFile, err = dal.processFitFile(tx, mediaFileInfo, file)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
	default:
		return nil, ErrFileNotSupported
	}

	return mediaFile, nil
}
