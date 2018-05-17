package picturesdal

import (
	"errors"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
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

func NewMediaServerDAL(picturesBasePath, cachesBasePath, dataDir string, maxConcurrentResizes uint) (*MediaServerDAL, error) {
	pictureResizer := pictures.NewPictureResizer(maxConcurrentResizes)

	thumbnailsCache, err := diskcache.NewThumbnailsCache(filepath.Join(cachesBasePath, "thumbnails"), pictureResizer)
	if nil != err {
		return nil, err
	}

	picturesMetadataDAL := NewPicturesMetadataDAL(picturesBasePath, thumbnailsCache)

	picturesDAL, err := NewPicturesDAL(picturesBasePath, cachesBasePath, picturesMetadataDAL, thumbnailsCache, pictureResizer)
	if nil != err {
		return nil, err
	}

	err = os.MkdirAll(dataDir, 0700)
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

	err = dal.PicturesDAL.EnsureAllThumbnailsForPictures([]*pictures.PictureMetadata{pictureMetadata})
	if err != nil {
		return nil, err
	}

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
