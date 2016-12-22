package picturesdal

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/picturescache"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/rwcarlsen/goexif/exif"
)

type PicturesDAL struct {
	rootpath string
	cache    *picturescache.PicturesCache
}

func NewPicturesDAL(rootpath string) *PicturesDAL {
	return &PicturesDAL{rootpath, picturescache.NewPicturesCache()}
}

func (dal *PicturesDAL) GetAll() []*pictures.PictureMetadata {
	return dal.cache.GetAll()
}

func (dal *PicturesDAL) GetStateHashCode() pictures.HashValue {
	return dal.cache.GetHashValue()
}

// can be null if no metadata
func (dal *PicturesDAL) Get(hashValue pictures.HashValue) *pictures.PictureMetadata {
	return dal.cache.Get(hashValue)
}

func (dal *PicturesDAL) UpdatePicturesCache() error {
	var picturesMetadatas []*pictures.PictureMetadata

	err := filepath.Walk(dal.rootpath, func(path string, fileinfo os.FileInfo, err error) error {
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

		pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.rootpath), fileinfo.Size(), exifData)
		picturesMetadatas = append(picturesMetadatas, pictureMetadata) // todo concurrency

		return nil
	})

	if nil != err {
		return err
	}

	newCache := picturescache.NewPicturesCache()
	newCache.Add(picturesMetadatas...)
	var mu sync.Mutex
	mu.Lock()
	dal.cache = newCache
	mu.Unlock()
	return nil
}

// GetRawPicture returns a the raw picture for a piece of metadata
// it doesn't handle transforming the picture
func (picturesDAL *PicturesDAL) GetRawPicture(pictureMetadata *pictures.PictureMetadata) (image.Image, string, error) {
	file, err := os.Open(filepath.Join(picturesDAL.rootpath, pictureMetadata.RelativeFilePath))
	if nil != err {
		return nil, "", err
	}
	defer file.Close()

	return image.Decode(file)
}

func hashOfFile(file io.Reader) (pictures.HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return pictures.HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
