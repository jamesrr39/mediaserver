package picturesdal

import (
	"errors"
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
	//
	// var fileByteBuffer bytes.Buffer
	// _, err := io.Copy(&fileByteBuffer, file)
	// if nil != err {
	// 	return nil, err
	// }
	//
	// fileHash, err := hashOfFile(bytes.NewBuffer(fileByteBuffer.Bytes()))
	// if nil != err {
	// 	return nil, err
	// }
	//
	// if nil != dal.PicturesMetadataDAL.Get(fileHash) {
	// 	return nil, ErrFileAlreadyExists
	// }
	//
	// _, _, err = image.Decode(bytes.NewBuffer(fileByteBuffer.Bytes()))
	// if nil != err {
	// 	return nil, fmt.Errorf("couldn't decode image. Error: %s", err)
	// }
	//
	// exifData, err := exif.Decode(bytes.NewBuffer(fileByteBuffer.Bytes()))
	// if nil != err {
	// 	log.Printf("not able to read metadata. Error: %s\n", err)
	// }

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, err
	}

	relativeFolderPath := filepath.Join(dal.rootpath, "uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	absoluteFilePath, relativeFilePath, err := dal.getPathForNewFile(relativeFolderPath, filename)
	if nil != err {
		return nil, err
	}

	pictureMetadata, _, err := pictures.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
	if nil != err {
		return nil, err
	}

	if nil != dal.PicturesMetadataDAL.Get(pictureMetadata.HashValue) {
		return nil, ErrFileAlreadyExists
	}

	err = os.MkdirAll(filepath.Dir(absoluteFilePath), 0755)
	if nil != err {
		return nil, err
	}

	log.Println("writing to " + absoluteFilePath)

	err = ioutil.WriteFile(absoluteFilePath, fileBytes, 0644)
	if nil != err {
		return nil, err
	}

	dal.PicturesMetadataDAL.add(pictureMetadata)

	return pictureMetadata, nil
}

func (dal *MediaServerDAL) getPathForNewFile(folder, filename string) (string, string, error) {

	fileExtension := filepath.Ext(filename)
	withoutExtension := strings.TrimSuffix(filename, fileExtension)

	for i := 0; i < 100000; i++ {
		name := withoutExtension
		if 0 != i {
			name += "_" + strconv.Itoa(i)
		}
		name += fileExtension

		relativePath := filepath.Join(folder, name)
		path := filepath.Join(dal.rootpath, relativePath)
		_, err := os.Stat(path)
		if nil != err {
			if os.IsNotExist(err) {
				return path, relativePath, nil
			}
			return "", "", err
		}
	}
	return "", "", errors.New("ran out of numbers for the new file")

}
