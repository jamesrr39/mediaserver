package picturesdal

import (
	"bytes"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"mediaserverapp/mediaserver/picturesdal/diskstorage"
	"mediaserverapp/mediaserver/picturesdal/picturesmetadatacache"
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
}

func NewMediaFilesDAL(picturesBasePath string, thumbnailsCache *diskcache.ThumbnailsCache) *MediaFilesDAL {
	return &MediaFilesDAL{picturesBasePath, picturesmetadatacache.NewMediaFilesCache(), diskstorage.NewPicturesMetadataRepository(), thumbnailsCache}
}

func (dal *MediaFilesDAL) GetAll() []pictures.MediaFile {
	return dal.cache.GetAll()
}

// GetStateHashCode returns a hash that identifies the cache's current state
// TODO: is this needed?
func (dal *MediaFilesDAL) GetStateHashCode() pictures.HashValue {
	return dal.cache.GetHashValue()
}

func (dal *MediaFilesDAL) add(pictureMetadata pictures.MediaFile) error {
	return dal.cache.Add(pictureMetadata)
}

// Get returns the picture metadata for a given hash. If the hash is not found, nil will be returned.
func (dal *MediaFilesDAL) Get(hashValue pictures.HashValue) pictures.MediaFile {
	return dal.cache.Get(hashValue)
}

func (dal *MediaFilesDAL) processPictureFile(tx *sql.Tx, path string) (*pictures.PictureMetadata, error) {

	fileBytes, err := ioutil.ReadFile(path)
	if nil != err {
		return nil, err
	}

	relativeFilePath := strings.TrimPrefix(path, dal.picturesBasePath)

	// look from DB cache
	hash, err := pictures.NewHash(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, err
	}

	pictureMetadata, err := dal.dbDAL.GetPictureMetadata(tx, hash, relativeFilePath)
	if nil != err {
		if err != diskstorage.ErrNotFound {
			return nil, fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", relativeFilePath, err)
		}
		pictureMetadata, _, err = pictures.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
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
	var mediaFiles []pictures.MediaFile

	walkFunc := func(path string, fileinfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileinfo.IsDir() {
			// skip
			return nil
		}

		var mediaFile pictures.MediaFile
		fileExtensionLower := strings.ToLower(filepath.Ext(path))
		switch fileExtensionLower {
		case ".jpg", ".jpeg", ".png":
			mediaFile, err = dal.processPictureFile(tx, path)
			if err != nil {
				return err
			}
		case ".mov":
			log.Printf("found .mov file at %s\n", path)
			return nil
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
