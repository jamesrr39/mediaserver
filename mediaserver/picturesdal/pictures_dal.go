package picturesdal

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"os"
	"path/filepath"
	"strconv"
)

var ErrHashNotFound = errors.New("hash not found")

type PicturesDAL struct {
	picturesBasePath    string
	thumbnailsCache     *diskcache.ThumbnailsCache
	picturesMetadataDAL *PicturesMetadataDAL
}

func NewPicturesDAL(picturesBasePath, cachesBasePath string, picturesMetadataDAL *PicturesMetadataDAL) (*PicturesDAL, error) {
	thumbnailsCacheConn, err := diskcache.NewThumbnailsCacheConn(filepath.Join(cachesBasePath, "thumbnails"))
	if nil != err {
		return nil, err
	}

	return &PicturesDAL{picturesBasePath, thumbnailsCacheConn, picturesMetadataDAL}, nil
}

func (dal *PicturesDAL) GetPictureBytes(hash pictures.HashValue, width, height string) (io.Reader, string, error) {
	isSizeCachable := dal.thumbnailsCache.IsSizeCacheable(width, height)
	if isSizeCachable {
		// look in on-disk cache for thumbnail
		file, pictureFormat, err := dal.thumbnailsCache.Get(hash)
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

	sizeToResizeTo, err := widthAndHeightStringsToSize(
		width,
		height,
		pictures.Size{
			Width:  uint(picture.Bounds().Max.X),
			Height: uint(picture.Bounds().Max.Y),
		})
	if nil != err {
		return nil, "", err
	}

	log.Printf("resizing to %v\n", sizeToResizeTo)
	picture = pictures.ResizePicture(picture, sizeToResizeTo)

	byteBuffer := bytes.NewBuffer(nil)

	switch pictureFormat {
	case "jpeg":
		jpeg.Encode(byteBuffer, picture, nil)
	case "png":
		png.Encode(byteBuffer, picture)
	case "gif":
		gif.Encode(byteBuffer, picture, nil)
	default:
		return nil, "", fmt.Errorf("mime type not supported: '%s'", pictureFormat)
	}

	if isSizeCachable {
		go dal.saveThumbnailToCache(hash, pictureFormat, byteBuffer.Bytes())
	}
	return bytes.NewBuffer(byteBuffer.Bytes()), pictureFormat, nil
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

func (dal *PicturesDAL) saveThumbnailToCache(hash pictures.HashValue, pictureFormat string, gzippedThumbnailBytes []byte) {
	log.Printf("saving %s with mimetype '%s'\n", hash, pictureFormat)
	err := dal.thumbnailsCache.Save(hash, pictureFormat, gzippedThumbnailBytes)
	if nil != err {
		log.Printf("ERROR writing thumbnail to on-disk cache for hash '%s'. Error: '%s'\n", hash, err)
	}
}

// widthAndHeightStringsToSize scales the maximum picture dimenions to the width and height URL Query parameters
// it will use the smallest size
// example: Picture 300w x 400h , widthParam "600" heightParam "900"
// resulting size: 600 x 800
// we won't size the picture up from the original picture size
func widthAndHeightStringsToSize(widthParam, heightParam string, pictureSize pictures.Size) (pictures.Size, error) {
	if "" == widthParam && "" == heightParam {
		return pictureSize, nil
	}

	var width, height int
	var err error
	if "" == widthParam {
		width = int(pictureSize.Width)
	} else {
		width, err = strconv.Atoi(widthParam)
		if nil != err {
			return pictures.Size{}, err
		}
	}

	if "" == heightParam {
		height = int(pictureSize.Height)
	} else {
		height, err = strconv.Atoi(heightParam)
		if nil != err {
			return pictures.Size{}, err
		}
	}

	// max allowed width; smallest from picture width or width from param
	maxAllowedWidth := int(pictureSize.Width)
	if width < maxAllowedWidth {
		maxAllowedWidth = width
	}

	// max allowed height; smallest from picture height or height from param
	maxAllowedHeight := int(pictureSize.Height)
	if height < maxAllowedHeight {
		maxAllowedHeight = height
	}

	widthRatio := float64(maxAllowedWidth) / float64(int(pictureSize.Width))
	heightRatio := float64(maxAllowedHeight) / float64(int(pictureSize.Height))

	smallestRatio := widthRatio
	if heightRatio < smallestRatio {
		smallestRatio = heightRatio
	}

	return pictures.Size{
		Width:  uint(float64(pictureSize.Width) * smallestRatio),
		Height: uint(float64(pictureSize.Height) * smallestRatio),
	}, nil
}
