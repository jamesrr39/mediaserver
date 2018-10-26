package picturesdal

import (
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/picturesdal/diskcache"
	"mediaserverapp/mediaserver/picturesdal/diskstorage"
	"mediaserverapp/mediaserver/picturesdal/videodal"
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
	Rootpath       string
	PicturesDAL    *PicturesDAL
	MediaFilesDAL  *MediaFilesDAL
	CollectionsDAL *diskstorage.CollectionsRepository
	VideosDAL      videodal.VideoDAL
}

func NewMediaServerDAL(picturesBasePath, cachesBasePath, dataDir string, maxConcurrentResizes, maxConcurrentVideoConversions uint) (*MediaServerDAL, error) {
	pictureResizer := domain.NewPictureResizer(maxConcurrentResizes)

	thumbnailsCache, err := diskcache.NewThumbnailsCache(filepath.Join(cachesBasePath, "thumbnails"), pictureResizer)
	if nil != err {
		return nil, err
	}

	videosDAL := videodal.NewNoActionVideoDAL()

	mediaFilesDAL := NewMediaFilesDAL(picturesBasePath, thumbnailsCache, videosDAL)

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
		videosDAL,
	}, nil
}

var ErrContentTypeNotSupported = errors.New("content type not supported")

// Create adds a new picture to the collection
func (dal *MediaServerDAL) Create(file io.Reader, filename, contentType string) (domain.MediaFile, error) {

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

	doAtEnd := func() error { return nil }
	var mediaFile domain.MediaFile
	switch contentType {
	case "image/jpg", "image/jpeg", "image/png":
		pictureMetadata, _, err := domain.NewPictureMetadataAndPictureFromBytes(fileBytes, relativeFilePath)
		if nil != err {
			return nil, err
		}
		mediaFile = pictureMetadata

		doAtEnd = func() error {
			return dal.PicturesDAL.EnsureAllThumbnailsForPictures([]*domain.PictureMetadata{pictureMetadata})
		}
	case "video/mp4":
		hashValue, err := domain.NewHash(bytes.NewBuffer(fileBytes))
		if nil != err {
			return nil, err
		}

		videoFile := domain.NewVideoFileMetadata(hashValue, relativeFilePath, int64(len(fileBytes)))
		mediaFile = videoFile

		doAtEnd = func() error {
			return dal.VideosDAL.EnsureSupportedFile(videoFile)
		}
	case "application/octet-stream":
		// try parsing fit file

	default:
		log.Printf("content type not supported: %q\n", contentType)
		return nil, ErrContentTypeNotSupported
	}

	if nil != dal.MediaFilesDAL.Get(mediaFile.GetHashValue()) {
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

	err = doAtEnd()
	if nil != err {
		return nil, err
	}

	dal.MediaFilesDAL.add(mediaFile)

	return mediaFile, nil
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
		path := filepath.Join(dal.Rootpath, relativePath)
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
