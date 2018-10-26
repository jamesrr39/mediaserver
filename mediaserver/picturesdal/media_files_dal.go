package picturesdal

import (
	"bytes"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"mediaserverapp/mediaserver/picturesdal/diskstorage"
	"mediaserverapp/mediaserver/picturesdal/picturesmetadatacache"
	"mediaserverapp/mediaserver/picturesdal/videodal"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/jamesrr39/goutil/fswalker"
)

type MediaFilesDAL struct {
	picturesBasePath string
	cache            *picturesmetadatacache.MediaFilesCache
	dbDAL            *diskstorage.PicturesMetadataRepository // FIXME rename
	thumbnailsCache  *diskcache.ThumbnailsCache
	videosDAL        videodal.VideoDAL
}

func NewMediaFilesDAL(picturesBasePath string, thumbnailsCache *diskcache.ThumbnailsCache, videosDAL videodal.VideoDAL) *MediaFilesDAL {
	return &MediaFilesDAL{picturesBasePath, picturesmetadatacache.NewMediaFilesCache(), diskstorage.NewPicturesMetadataRepository(), thumbnailsCache, videosDAL}
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

func (dal *MediaFilesDAL) GetFullPath(mediaFile domain.MediaFile) string {
	return filepath.Join(dal.picturesBasePath, mediaFile.GetRelativePath())
}

func (dal *MediaFilesDAL) processVideoFile(tx *sql.Tx, path string, fileInfo os.FileInfo) (*domain.VideoFileMetadata, error) {

	file, err := os.Open(path)
	if nil != err {
		return nil, err
	}
	defer file.Close()

	relativeFilePath := strings.TrimPrefix(path, dal.picturesBasePath)

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, err
	}

	_, err = file.Seek(0, 0)
	if nil != err {
		return nil, err
	}

	videoFileMetadata := domain.NewVideoFileMetadata(hashValue, relativeFilePath, fileInfo.Size())

	err = dal.videosDAL.EnsureSupportedFile(videoFileMetadata)
	if nil != err {
		return nil, err
	}

	return videoFileMetadata, nil
}

func (dal *MediaFilesDAL) processPictureFile(tx *sql.Tx, path string) (*domain.PictureMetadata, error) {

	fileBytes, err := ioutil.ReadFile(path)
	if nil != err {
		return nil, err
	}

	relativeFilePath := strings.TrimPrefix(path, dal.picturesBasePath)

	// look from DB cache
	hash, err := domain.NewHash(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, err
	}

	pictureMetadata, err := dal.dbDAL.GetPictureMetadata(tx, hash, relativeFilePath)
	if nil != err {
		if err != diskstorage.ErrNotFound {
			return nil, fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", relativeFilePath, err)
		}
		pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
		if nil != err {
			return nil, err
		}

		err = dal.dbDAL.CreatePictureMetadata(tx, pictureMetadata)
		if nil != err {
			return nil, fmt.Errorf("unexpected error setting picture metadata to database for relative file path '%s': '%s'", relativeFilePath, err)
		}
	}

	return pictureMetadata, nil
}

func (dal *MediaFilesDAL) UpdatePicturesCache(tx *sql.Tx) error {
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
			mediaFile, err = dal.processPictureFile(tx, path)
			if err != nil {
				return err
			}
		case ".mp4":
			mediaFile, err = dal.processVideoFile(tx, path, fileinfo)
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
