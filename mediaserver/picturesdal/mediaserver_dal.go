package picturesdal

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/gif"  // Decode
	_ "image/jpeg" // Decode
	_ "image/png"  // Decode
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/rwcarlsen/goexif/exif"
)

var (
	ErrIllegalPathTraversingUp = errors.New("file path is traversing up")
	ErrFileAlreadyExists       = errors.New("a file with this hash already exists")
)

type MediaServerDAL struct {
	rootpath            string
	PicturesDAL         *PicturesDAL
	PicturesMetadataDAL *PicturesMetadataDAL
}

func NewMediaServerDAL(picturesBasePath, cachesBasePath string) (*MediaServerDAL, error) {
	picturesMetadataDAL := NewPicturesMetadataDAL(picturesBasePath)

	picturesDAL, err := NewPicturesDAL(picturesBasePath, cachesBasePath, picturesMetadataDAL)
	if nil != err {
		return nil, err
	}

	return &MediaServerDAL{
		picturesBasePath,
		picturesDAL,
		picturesMetadataDAL,
	}, nil
}

// Create adds a new picture to the collection
// TODO: is contentType needed?
func (dal *MediaServerDAL) Create(file io.Reader, filename, contentType string) (*pictures.PictureMetadata, error) {

	if dirtraversal.IsTryingToTraverseUp(filename) {
		return nil, ErrIllegalPathTraversingUp
	}

	var fileByteBuffer bytes.Buffer
	_, err := io.Copy(&fileByteBuffer, file)
	if nil != err {
		return nil, err
	}

	fileHash, err := hashOfFile(bytes.NewBuffer(fileByteBuffer.Bytes()))
	if nil != err {
		return nil, err
	}

	if nil != dal.PicturesMetadataDAL.Get(fileHash) {
		return nil, ErrFileAlreadyExists
	}

	_, _, err = image.Decode(bytes.NewBuffer(fileByteBuffer.Bytes()))
	if nil != err {
		return nil, fmt.Errorf("couldn't decode image. Error: %s", err)
	}

	exifData, err := exif.Decode(bytes.NewBuffer(fileByteBuffer.Bytes()))
	if nil != err {
		log.Printf("not able to read metadata. Error: %s\n", err)
	}

	folder := filepath.Join(dal.rootpath, "uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	err = os.MkdirAll(folder, 0755)
	if nil != err {
		return nil, err
	}

	path, err := getPathForNewFile(folder, filename)
	if nil != err {
		return nil, err
	}
	log.Println("writing to " + path)
	err = ioutil.WriteFile(path, fileByteBuffer.Bytes(), 0644)
	if nil != err {
		return nil, err
	}

	fileinfo, err := os.Stat(path)
	if nil != err {
		return nil, err
	}

	pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.rootpath), fileinfo.Size(), exifData)
	dal.PicturesMetadataDAL.add(pictureMetadata)

	return pictureMetadata, nil
}

func getPathForNewFile(folder, filename string) (string, error) {

	fileExtension := filepath.Ext(filename)
	withoutExtension := strings.TrimSuffix(filename, fileExtension)

	for i := 0; i < 100000; i++ {
		name := withoutExtension
		if 0 != i {
			name += "_" + strconv.Itoa(i)
		}
		name += fileExtension

		path := filepath.Join(folder, name)
		_, err := os.Stat(path)
		if nil != err {
			if os.IsNotExist(err) {
				return path, nil
			}
			return "", err
		}
	}
	return "", errors.New("ran out of numbers for the new file")

}

func hashOfFile(file io.Reader) (pictures.HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return pictures.HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
