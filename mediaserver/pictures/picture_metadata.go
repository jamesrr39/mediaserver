package pictures

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/gif"  // Decode
	_ "image/jpeg" // Decode
	_ "image/png"  // Decode
	"io"
	"log"

	"github.com/jamesrr39/goutil/image-processing/imageprocessingutil"
	"github.com/rwcarlsen/goexif/exif"
)

type HashValue string

type RawSize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

func RawSizeFromImage(picture image.Image) RawSize {
	return RawSize{
		Width:  picture.Bounds().Max.X,
		Height: picture.Bounds().Max.Y,
	}
}

type PictureMetadata struct {
	HashValue        `json:"hashValue"`
	RelativeFilePath string     `json:"relativeFilePath"`
	FileSizeBytes    int64      `json:"fileSizeBytes"`
	ExifData         *exif.Exif `json:"exif"`
	RawSize          RawSize    `json:"rawSize"`
	Format           string     `json:"format"`
}

func NewPictureMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64, exifData *exif.Exif, rawSize RawSize, format string) *PictureMetadata {
	return &PictureMetadata{hashValue, relativeFilePath, fileSizeBytes, exifData, rawSize, format}
}

func NewPictureMetadataAndPictureFromBytes(fileBytes []byte, relativeFilePath string) (*PictureMetadata, image.Image, error) {
	hash, err := hashOfFile(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, nil, err
	}

	picture, format, err := image.Decode(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, nil, fmt.Errorf("couldn't decode image. Error: %s", err)
	}

	exifData, err := exif.Decode(bytes.NewBuffer(fileBytes))
	if nil != err {
		log.Printf("not able to read metadata. Error: %s\n", err)
	}

	// FIXME: tests for no orientation exif tag, no exif data
	if nil != exifData {
		transformedPicture, err := imageprocessingutil.RotateAndTransformPictureByExifData(picture, *exifData)
		if nil != err {
			log.Printf("couldn't rotate and transform picture with hash '%s'. Error: '%s'\n", hash, err)
		} else {
			picture = transformedPicture
		}
	}

	return NewPictureMetadata(hash, relativeFilePath, int64(len(fileBytes)), exifData, RawSizeFromImage(picture), format), picture, nil
}

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativeFilePath + ")"
}

func hashOfFile(file io.Reader) (HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
