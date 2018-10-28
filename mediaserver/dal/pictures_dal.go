package dal

import (
	"bytes"
	"errors"
	"image"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/dal/diskcache"
	"mediaserverapp/mediaserver/domain"
	"os"
	"path/filepath"
)

var ErrHashNotFound = errors.New("hash not found")

type PicturesDAL struct {
	picturesBasePath string
	thumbnailsCache  *diskcache.ThumbnailsCache
	MediaFilesDAL    *MediaFilesDAL
	pictureResizer   *domain.PictureResizer
}

func NewPicturesDAL(picturesBasePath, cachesBasePath string, picturesMetadataDAL *MediaFilesDAL, thumbnailsCache *diskcache.ThumbnailsCache, pictureResizer *domain.PictureResizer) (*PicturesDAL, error) {
	return &PicturesDAL{picturesBasePath, thumbnailsCache, picturesMetadataDAL, pictureResizer}, nil
}

func (dal *PicturesDAL) GetPictureBytes(hash domain.HashValue, size domain.Size) (io.Reader, string, error) {
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
	pictureMetadata := dal.MediaFilesDAL.Get(hash)
	if pictureMetadata == nil || pictureMetadata.GetMediaFileInfo().MediaFileType != domain.MediaFileTypePicture {
		return nil, "", ErrHashNotFound
	}

	picture, pictureFormat, err := dal.GetPicture(pictureMetadata.(*domain.PictureMetadata))
	if nil != err {
		return nil, "", err
	}

	picture = dal.pictureResizer.ResizePicture(picture, size)

	pictureBytes, err := domain.EncodePicture(picture, pictureFormat)
	if err != nil {
		return nil, "", err
	}

	if isSizeCachable {
		go dal.saveThumbnailToCache(hash, size, pictureFormat, pictureBytes)
	}
	return bytes.NewBuffer(pictureBytes), pictureFormat, nil
}

func (dal *PicturesDAL) GetPicture(pictureMetadata *domain.PictureMetadata) (image.Image, string, error) {
	file, err := os.Open(filepath.Join(dal.picturesBasePath, pictureMetadata.RelativePath))
	if nil != err {
		return nil, "", err
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, "", err
	}

	_, picture, err := domain.NewPictureMetadataAndPictureFromBytes(fileBytes, pictureMetadata.RelativePath)
	if nil != err {
		return nil, "", err
	}

	return picture, pictureMetadata.Format, nil
}

func (dal *PicturesDAL) EnsureAllThumbnailsForPictures(pictureMetadatas []*domain.PictureMetadata) error {
	for _, pictureMetadata := range pictureMetadatas {
		err := dal.thumbnailsCache.EnsureAllThumbnailsForPicture(pictureMetadata, dal.GetPicture)
		if err != nil {
			return err
		}
	}
	return nil
}

func (dal *PicturesDAL) saveThumbnailToCache(hash domain.HashValue, size domain.Size, pictureFormat string, gzippedThumbnailBytes []byte) {
	log.Printf("saving %s with mimetype '%s'\n", hash, pictureFormat)
	err := dal.thumbnailsCache.Save(hash, size, pictureFormat, gzippedThumbnailBytes)
	if nil != err {
		log.Printf("ERROR writing thumbnail to on-disk cache for hash '%s'. Error: '%s'\n", hash, err)
	}
}
