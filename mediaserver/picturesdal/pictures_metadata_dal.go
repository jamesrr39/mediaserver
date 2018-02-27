package picturesdal

import (
	"bytes"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/picturesmetadatacache"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/rwcarlsen/goexif/exif"
)

type PicturesMetadataDAL struct {
	picturesBasePath string
	cache            *picturesmetadatacache.PicturesMetadataCache
}

func NewPicturesMetadataDAL(picturesBasePath string) *PicturesMetadataDAL {
	return &PicturesMetadataDAL{picturesBasePath, picturesmetadatacache.NewPicturesMetadataCache()}
}

func (dal *PicturesMetadataDAL) GetAll() []*pictures.PictureMetadata {
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

func (dal *PicturesMetadataDAL) UpdatePicturesCache() error {
	var picturesMetadatas []*pictures.PictureMetadata

	err := filepath.Walk(dal.picturesBasePath, func(path string, fileinfo os.FileInfo, err error) error {
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
		if err != nil {
			return err
		}

		fileHash, err := hashOfFile(bytes.NewBuffer(fileBytes))
		if nil != err {
			return err
		}

		exifData, err := exif.Decode(bytes.NewBuffer(fileBytes))
		if nil != err {
			log.Printf("not able to read metadata for %s. Error: %s\n", path, err)
		}

		pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.picturesBasePath), fileinfo.Size(), exifData)
		picturesMetadatas = append(picturesMetadatas, pictureMetadata) // todo concurrency

		return nil
	})

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
