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

type PicturesMetadataDAL struct {
	picturesBasePath string
	cache            *picturesmetadatacache.PicturesMetadataCache
	dbDAL            *diskstorage.PicturesMetadataRepository // FIXME rename
	thumbnailsCache  *diskcache.ThumbnailsCache
}

func NewPicturesMetadataDAL(picturesBasePath string, thumbnailsCache *diskcache.ThumbnailsCache) *PicturesMetadataDAL {
	return &PicturesMetadataDAL{picturesBasePath, picturesmetadatacache.NewPicturesMetadataCache(), diskstorage.NewPicturesMetadataRepository(), thumbnailsCache}
}

func (dal *PicturesMetadataDAL) GetAll() []pictures.MediaFile {
	return dal.cache.GetAll()
}

// GetStateHashCode returns a hash that identifies the cache's current state
// TODO: is this needed?
func (dal *PicturesMetadataDAL) GetStateHashCode() pictures.HashValue {
	return dal.cache.GetHashValue()
}

func (dal *PicturesMetadataDAL) add(pictureMetadata *pictures.PictureMetadata) error {
	return dal.cache.Add(pictureMetadata)
}

// Get returns the picture metadata for a given hash. If the hash is not found, nil will be returned.
func (dal *PicturesMetadataDAL) Get(hashValue pictures.HashValue) *pictures.PictureMetadata {
	return dal.cache.Get(hashValue)
}

func (dal *PicturesMetadataDAL) UpdatePicturesCache(tx *sql.Tx) error {
	var picturesMetadatas []*pictures.PictureMetadata

	walkFunc := func(path string, fileinfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileinfo.IsDir() {
			// skip
			return nil
		}

		fileExtensionLower := strings.ToLower(filepath.Ext(path))
		if fileExtensionLower != ".jpg" && fileExtensionLower != ".jpeg" && fileExtensionLower != ".png" {
			log.Println("skipping " + path + ", file extension (lower case) '" + fileExtensionLower + " not recognised")
			return nil
		}

		fileBytes, err := ioutil.ReadFile(path)
		if nil != err {
			return err
		}

		relativeFilePath := strings.TrimPrefix(path, dal.picturesBasePath)

		// look from DB cache
		hash, err := pictures.NewHash(bytes.NewBuffer(fileBytes))
		if nil != err {
			return err
		}

		pictureMetadata, err := dal.dbDAL.GetPictureMetadata(tx, hash, relativeFilePath)
		if nil != err {
			if err != diskstorage.ErrNotFound {
				return fmt.Errorf("unexpected error getting picture metadata from database for relative path '%s': '%s'", relativeFilePath, err)
			}
			pictureMetadata, _, err = pictures.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
			if nil != err {
				return err
			}

			err = dal.dbDAL.CreatePictureMetadata(tx, pictureMetadata)
			if nil != err {
				return fmt.Errorf("unexpected error setting picture metadata to database for relative file path '%s': '%s'", relativeFilePath, err)
			}
		}

		picturesMetadatas = append(picturesMetadatas, pictureMetadata) // todo concurrency

		return nil
	}

	err := fswalker.Walk(dal.picturesBasePath, walkFunc, fswalker.WalkOptions{FollowSymlinks: true})
	if nil != err {
		return err
	}

	newCache := picturesmetadatacache.NewPicturesMetadataCache()
	newCache.AddBatch(picturesMetadatas...)
	var mu sync.Mutex
	mu.Lock()
	dal.cache = newCache
	mu.Unlock()
	return nil
}
