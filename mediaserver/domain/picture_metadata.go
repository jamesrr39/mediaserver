package domain

import (
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
	MediaFileInfo
	ExifData *ExifData `json:"exif"`
	RawSize  RawSize   `json:"rawSize"`
	Format   string    `json:"format"`
}

func (pm *PictureMetadata) GetMediaFileInfo() MediaFileInfo {
	return pm.MediaFileInfo
}

func NewPictureMetadata(hashValue HashValue, relativePath string, fileSizeBytes int64, exifData *ExifData, rawSize RawSize, format string) *PictureMetadata {
	return &PictureMetadata{MediaFileInfo{relativePath, hashValue, MediaFileTypePicture, fileSizeBytes}, exifData, rawSize, format}
}

func NewPictureMetadataAndPictureFromBytes(file io.ReadSeeker, relativePath string, hash HashValue) (*PictureMetadata, image.Image, error) {
	picture, format, err := image.Decode(file)
	if nil != err {
		return nil, nil, fmt.Errorf("couldn't decode image. Error: %s", err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, nil, err
	}

	exifData, err := DecodeExifFromFile(file)
	if nil != err {
		log.Printf("not able to read metadata (maybe there is none). Error: %s\n", err)
	}

	if exifData != nil {
		orientation, err := exifData.GetOrientation()
		if err != nil {
			log.Printf("couldn't get exif orientation information for picture with hash '%s' and relative path '%s'. Error: '%s'\n", hash, relativePath, err)
		} else {
			picture = imageprocessingutil.FlipAndRotatePictureByExif(picture, orientation)
		}
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, nil, err
	}
	fileLen, err := file.Seek(0, io.SeekEnd)
	if err != nil {
		return nil, nil, err
	}

	return NewPictureMetadata(hash, relativePath, fileLen, exifData, RawSizeFromImage(picture), format), picture, nil
}

func (pictureMetadata *PictureMetadata) String() string {
	return string(pictureMetadata.HashValue) + " (" + pictureMetadata.RelativePath + ")"
}

func NewHash(file io.Reader) (HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
