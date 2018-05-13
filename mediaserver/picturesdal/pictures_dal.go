package picturesdal

import (
	"bytes"
	"errors"
	"image"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"os"
	"path/filepath"
)

var ErrHashNotFound = errors.New("hash not found")

type PicturesDAL struct {
	picturesBasePath    string
	thumbnailsCache     *diskcache.ThumbnailsCache
	picturesMetadataDAL *PicturesMetadataDAL
	pictureResizer      *pictures.PictureResizer
}

func NewPicturesDAL(picturesBasePath, cachesBasePath string, picturesMetadataDAL *PicturesMetadataDAL, thumbnailsCache *diskcache.ThumbnailsCache, pictureResizer *pictures.PictureResizer) (*PicturesDAL, error) {
	return &PicturesDAL{picturesBasePath, thumbnailsCache, picturesMetadataDAL, pictureResizer}, nil
}

func (dal *PicturesDAL) GetPictureBytes(hash pictures.HashValue, size pictures.Size) (io.Reader, string, error) {
	isSizeCachable := dal.thumbnailsCache.IsSizeCacheable(size)
	if isSizeCachable {
		// look in on-disk cache for thumbnail
		file, pictureFormat, err := dal.thumbnailsCache.Get(hash, size)
		if nil == err && nil != file {
			return file, pictureFormat, nil
		}

		if nil != err {
			log.Printf("ERROR getting thumbnail from cache for hash: '%s'. Error: '%s'\n", hash, err)
		}
	}

	// picture not available in on-disk cache - fetch the image, perform transformations and save it to cache
	pictureMetadata := dal.picturesMetadataDAL.Get(hash)
	if pictureMetadata == nil {
		return nil, "", ErrHashNotFound
	}

	picture, pictureFormat, err := dal.GetPicture(pictureMetadata)
	if nil != err {
		return nil, "", err
	}

	picture = dal.pictureResizer.ResizePicture(picture, size)

	pictureBytes, err := pictures.EncodePicture(picture, pictureFormat)
	if err != nil {
		return nil, "", err
	}

	if isSizeCachable {
		go dal.saveThumbnailToCache(hash, size, pictureFormat, pictureBytes)
	}
	return bytes.NewBuffer(pictureBytes), pictureFormat, nil
}

func (dal *PicturesDAL) GetPicture(pictureMetadata *pictures.PictureMetadata) (image.Image, string, error) {
	file, err := os.Open(filepath.Join(dal.picturesBasePath, pictureMetadata.RelativeFilePath))
	if nil != err {
		return nil, "", err
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, "", err
	}

	_, picture, err := pictures.NewPictureMetadataAndPictureFromBytes(fileBytes, pictureMetadata.RelativeFilePath)
	if nil != err {
		return nil, "", err
	}

	return picture, pictureMetadata.Format, nil
}

func (dal *PicturesDAL) EnsureAllThumbnailsForPicture(pictureMetadata *pictures.PictureMetadata) error {
	return dal.thumbnailsCache.EnsureAllThumbnailsForPicture(pictureMetadata, dal.GetPicture)
}

func (dal *PicturesDAL) saveThumbnailToCache(hash pictures.HashValue, size pictures.Size, pictureFormat string, gzippedThumbnailBytes []byte) {
	log.Printf("saving %s with mimetype '%s'\n", hash, pictureFormat)
	err := dal.thumbnailsCache.Save(hash, size, pictureFormat, gzippedThumbnailBytes)
	if nil != err {
		log.Printf("ERROR writing thumbnail to on-disk cache for hash '%s'. Error: '%s'\n", hash, err)
	}
}
