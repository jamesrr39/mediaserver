package picturesdal

import (
	"errors"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"mediaserverapp/mediaserver/picturesdal/diskstorage"
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
	rootpath       string
	PicturesDAL    *PicturesDAL
	MediaFilesDAL  *MediaFilesDAL
	CollectionsDAL *diskstorage.CollectionsRepository
}

func NewMediaServerDAL(picturesBasePath, cachesBasePath, dataDir string, maxConcurrentResizes uint) (*MediaServerDAL, error) {
	pictureResizer := pictures.NewPictureResizer(maxConcurrentResizes)

	thumbnailsCache, err := diskcache.NewThumbnailsCache(filepath.Join(cachesBasePath, "thumbnails"), pictureResizer)
	if nil != err {
		return nil, err
	}

	mediaFilesDAL := NewMediaFilesDAL(picturesBasePath, thumbnailsCache)

	picturesDAL, err := NewPicturesDAL(picturesBasePath, cachesBasePath, mediaFilesDAL, thumbnailsCache, pictureResizer)
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
		mediaFilesDAL,
		diskstorage.NewCollectionsRepository(),
	}, nil
}

// Create adds a new picture to the collection
// TODO: is contentType needed?
// FIXME is this function needed
func (dal *MediaServerDAL) Create(file io.Reader, filename, contentType string) (*pictures.PictureMetadata, error) {

	if dirtraversal.IsTryingToTraverseUp(filename) {
		return nil, ErrIllegalPathTraversingUp
	}

	fileBytes, err := ioutil.ReadAll(file)
	if nil != err {
		return nil, err
	}

	relativeFolderPath := filepath.Join("uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	absoluteFilePath, relativeFilePath, err := dal.getPathForNewFile(relativeFolderPath, filename)
	if nil != err {
		return nil, err
	}

	pictureMetadata, _, err := pictures.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
	if nil != err {
		return nil, err
	}

	if nil != dal.MediaFilesDAL.Get(pictureMetadata.HashValue) {
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

	dal.MediaFilesDAL.add(pictureMetadata)

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
