package pictures

import (
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

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativeFilePath + ")"
}
