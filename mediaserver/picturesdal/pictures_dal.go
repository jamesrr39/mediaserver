package picturesdal

import (
	"crypto/sha1"
	"encoding/hex"
	"io"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/picturescache"
	"os"
	"path/filepath"
	"strings"
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

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		fileHash, err := hashOfFile(file)
		if nil != err {
			return err
		}

		pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.rootpath), fileinfo.Size())
		picturesMetadatas = append(picturesMetadatas, pictureMetadata) // todo concurrency

		return nil
	})

	if nil != err {
		return err
	}

	newCache := picturescache.NewPicturesCache()
	newCache.Add(picturesMetadatas...)
	dal.cache = newCache
	return nil
}

func hashOfFile(file *os.File) (pictures.HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return pictures.HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
