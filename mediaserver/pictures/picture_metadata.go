package pictures

import (
	"image"
	"log"

	"github.com/jamesrr39/goutil/image-processing/imageprocessingutil"

	"github.com/rwcarlsen/goexif/exif"
)

type HashValue string

type PictureMetadata struct {
	HashValue        `json:"hashValue"`
	RelativeFilePath string     `json:"relativeFilePath"`
	FileSizeBytes    int64      `json:"fileSizeBytes"`
	ExifData         *exif.Exif `json:"exif"`
}

func NewPictureMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64, exifData *exif.Exif) *PictureMetadata {
	return &PictureMetadata{hashValue, relativeFilePath, fileSizeBytes, exifData}
}

func (pictureMetadata *PictureMetadata) RotateAndTransformPictureByExifData(picture image.Image) (image.Image, error) {

	if nil == pictureMetadata.ExifData {
		log.Printf("no exif metadata available for %s to rotate or transform\n", pictureMetadata.RelativeFilePath)
		return picture, nil
	}

	return imageprocessingutil.RotateAndTransformPictureByExifData(picture, *pictureMetadata.ExifData)

}

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativeFilePath + ")"
}
