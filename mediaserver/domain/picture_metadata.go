package domain

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
)

type HashValue string

type RawSize struct {
	Width  uint `json:"width"`
	Height uint `json:"height"`
}

func (r RawSize) AspectRatio() float64 {
	return float64(r.Width) / float64(r.Height)
}

func RawSizeFromImage(picture image.Image) RawSize {
	return RawSize{
		Width:  uint(picture.Bounds().Max.X),
		Height: uint(picture.Bounds().Max.Y),
	}
}

type PictureMetadata struct {
	HashValue        `json:"hashValue"`
	MediaFileType    `json:"fileType"`
	RelativeFilePath string    `json:"relativeFilePath"`
	FileSizeBytes    int64     `json:"fileSizeBytes"`
	ExifData         *ExifData `json:"exif"`
	RawSize          RawSize   `json:"rawSize"`
	Format           string    `json:"format"`
}

func (pm *PictureMetadata) GetRelativePath() string {
	return pm.RelativeFilePath
}
func (pm *PictureMetadata) GetHashValue() HashValue {
	return pm.HashValue
}
func (pm *PictureMetadata) GetMediaFileType() MediaFileType {
	return MediaFileTypePicture
}
func (pm *PictureMetadata) GetFileSizeBytes() int64 {
	return pm.FileSizeBytes
}

func NewPictureMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64, exifData *ExifData, rawSize RawSize, format string) *PictureMetadata {
	return &PictureMetadata{hashValue, MediaFileTypePicture, relativeFilePath, fileSizeBytes, exifData, rawSize, format}
}

func NewPictureMetadataAndPictureFromBytes(fileBytes []byte, relativeFilePath string) (*PictureMetadata, image.Image, error) {
	hash, err := NewHash(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, nil, err
	}

	picture, format, err := image.Decode(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, nil, fmt.Errorf("couldn't decode image. Error: %s", err)
	}

	exifData, err := DecodeExifFromFile(bytes.NewBuffer(fileBytes))
	if nil != err {
		log.Printf("not able to read metadata (maybe there is none). Error: %s\n", err)
	}

	if exifData != nil {
		orientation, err := exifData.GetOrientation()
		if err != nil {
			log.Printf("couldn't get exif orientation information for picture with hash '%s' and relative path '%s'. Error: '%s'\n", hash, relativeFilePath, err)
		} else {
			picture = imageprocessingutil.FlipAndRotatePictureByExif(picture, orientation)
		}
	}

	return NewPictureMetadata(hash, relativeFilePath, int64(len(fileBytes)), exifData, RawSizeFromImage(picture), format), picture, nil
}

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativeFilePath + ")"
}

func NewHash(file io.Reader) (HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
