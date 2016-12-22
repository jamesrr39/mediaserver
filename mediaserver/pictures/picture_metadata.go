package pictures

import (
	"image"
	"log"

	"github.com/rwcarlsen/goexif/exif"
)

type HashValue string

type PictureMetadata struct {
	HashValue        `json:"hashValue"`
	RelativeFilePath string
	FileSizeBytes    int64      `json:"fileSizeBytes"`
	ExifData         *exif.Exif `json:"exif"`
}

func NewPictureMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64, exifData *exif.Exif) *PictureMetadata {
	return &PictureMetadata{hashValue, relativeFilePath, fileSizeBytes, exifData}
}

func (pictureMetadata *PictureMetadata) RotateAndTransformPictureByExifData(picture image.Image) (image.Image, error) {
	if nil == pictureMetadata.ExifData {
		log.Printf("No exif data available for %s, not rotating and transforming\n", pictureMetadata)
		return picture, nil
	}
	tag, err := pictureMetadata.ExifData.Get(exif.Orientation)
	if nil != err {
		return nil, err
	}

	exifOrientation, err := tag.Int(0)
	if nil != err {
		return nil, err
	}
	if exifOrientation == 0 {
		log.Printf("No exif orientation available for %s\n")
		return picture, nil
	}

	return flipAndRotatePictureByExif(picture, exifOrientation), nil

}

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativeFilePath + ")"
}
