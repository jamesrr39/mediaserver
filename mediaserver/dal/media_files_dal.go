package dal

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"mediaserverapp/mediaserver/dal/diskstorage"
	"mediaserverapp/mediaserver/dal/picturesmetadatacache"
	"mediaserverapp/mediaserver/dal/videodal"
	"mediaserverapp/mediaserver/domain"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/jamesrr39/goutil/fswalker"
	"github.com/jamesrr39/goutil/profile"
)

type MediaFilesDAL struct {
	picturesBasePath string
	cache            *picturesmetadatacache.MediaFilesCache
	dbDAL            *diskstorage.PicturesMetadataRepository // FIXME rename
	thumbnailsDAL    *ThumbnailsDAL
	videosDAL        videodal.VideoDAL
}

func NewMediaFilesDAL(picturesBasePath string, thumbnailsDAL *ThumbnailsDAL, videosDAL videodal.VideoDAL) *MediaFilesDAL {
	return &MediaFilesDAL{picturesBasePath, picturesmetadatacache.NewMediaFilesCache(), diskstorage.NewPicturesMetadataRepository(), thumbnailsDAL, videosDAL}
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

func (dal *MediaFilesDAL) OpenFile(mediaFile domain.MediaFile) (*os.File, error) {
	return os.Open(filepath.Join(dal.picturesBasePath, mediaFile.GetMediaFileInfo().RelativePath))
}

func (dal *MediaFilesDAL) processFitFile(tx *sql.Tx, path string, fileInfo os.FileInfo) (*domain.FitFileSummary, error) {
	file, err := os.Open(path)
	if nil != err {
		return nil, err
	}
	defer file.Close()

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, err
	}

	mediaFileInfo := domain.NewMediaFileInfo(relativePath, hashValue, domain.MediaFileTypeFitTrack, fileInfo.Size())

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, err
	}

	return domain.NewFitFileSummaryFromReader(mediaFileInfo, file)
}

func (dal *MediaFilesDAL) processVideoFile(tx *sql.Tx, path string, fileInfo os.FileInfo) (*domain.VideoFileMetadata, error) {

	file, err := os.Open(path)
	if nil != err {
		return nil, err
	}
	defer file.Close()

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, err
	}

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, err
	}

	videoFileMetadata := domain.NewVideoFileMetadata(hashValue, relativePath, fileInfo.Size())

	err = dal.videosDAL.EnsureSupportedFile(videoFileMetadata)
	if nil != err {
		return nil, err
	}

	return videoFileMetadata, nil
}

func (dal *MediaFilesDAL) processPictureFile(tx *sql.Tx, path string, profileRun *profile.Run) (*domain.PictureMetadata, error) {
	var err error
	var file *os.File

	profileRun.Measure("open file", func() {
		file, err = os.Open(path)
	})
	if nil != err {
		return nil, err
	}

	relativePath := strings.TrimPrefix(path, dal.picturesBasePath)

	var hash domain.HashValue
	profileRun.Measure("calculate file hash", func() {
		hash, err = domain.NewHash(file)
	})
	if nil != err {
		return nil, err
	}

	_, err = file.Seek(0, io.SeekStart)
	if nil != err {
		return nil, err
	}

	var pictureMetadata *domain.PictureMetadata
	profileRun.Measure("get metadata from db", func() {
		pictureMetadata, err = dal.dbDAL.GetPictureMetadata(tx, hash, relativePath)
	})
	if nil != err {
		if err != diskstorage.ErrNotFound {
			return nil, fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", relativePath, err)
		}
		profileRun.Measure("read picture metadata and picture from bytes", func() {
			pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(file, relativePath, hash)
		})
		if nil != err {
			return nil, err
		}

		profileRun.Measure("write picture metadata", func() {
			err = dal.dbDAL.CreatePictureMetadata(tx, pictureMetadata)
		})
		if nil != err {
			return nil, fmt.Errorf("unexpected error setting picture metadata to database for relative file path '%s': '%s'", relativePath, err)
		}
	}

	return pictureMetadata, nil
}

func (dal *MediaFilesDAL) UpdatePicturesCache(tx *sql.Tx, profileRun *profile.Run) error {
	var mediaFiles []domain.MediaFile

	walkFunc := func(path string, fileinfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileinfo.IsDir() {
			// skip
			return nil
		}

		var mediaFile domain.MediaFile
		fileExtensionLower := strings.ToLower(filepath.Ext(path))
		switch fileExtensionLower {
		case ".jpg", ".jpeg", ".png":
			profileRun.Measure("process picture file", func() {
				mediaFile, err = dal.processPictureFile(tx, path, profileRun)
			})
			if err != nil {
				return err
			}
		case ".mp4":
			profileRun.Measure("process video file", func() {
				mediaFile, err = dal.processVideoFile(tx, path, fileinfo)
			})
			if err != nil {
				return err
			}
		case ".fit":
			profileRun.Measure("process fit file", func() {
				mediaFile, err = dal.processFitFile(tx, path, fileinfo)
			})
			if err != nil {
				return err
			}
		default:
			log.Println("skipping " + path + ", file extension (lower case) '" + fileExtensionLower + " not recognised")
			return nil
		}

		mediaFiles = append(mediaFiles, mediaFile) // todo concurrency
		return nil
	}

	err := fswalker.Walk(dal.picturesBasePath, walkFunc, fswalker.WalkOptions{FollowSymlinks: true})
	if nil != err {
		return err
	}

	newCache := picturesmetadatacache.NewMediaFilesCache()
	newCache.AddBatch(mediaFiles...)
	var mu sync.Mutex
	mu.Lock()
	dal.cache = newCache
	mu.Unlock()
	return nil
}
