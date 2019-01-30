package dal

import (
	"errors"
	"io"
	"log"
	"mediaserverapp/mediaserver/dal/diskstorage"
	"mediaserverapp/mediaserver/dal/videodal"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/mediaserverjobs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jamesrr39/goutil/logger"
	"github.com/jamesrr39/goutil/profile"
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
	TracksDAL      *TracksDAL
	ThumbnailsDAL  *ThumbnailsDAL
}

func NewMediaServerDAL(logger logger.Logger, picturesBasePath, cachesBasePath, dataDir string, maxConcurrentCPUJobs, maxConcurrentVideoConversions uint) (*MediaServerDAL, error) {
	jobRunner := mediaserverjobs.NewJobRunner(logger, maxConcurrentCPUJobs)

	thumbnailsDAL, err := NewThumbnailsDAL(filepath.Join(cachesBasePath, "thumbnails"), jobRunner)
	if nil != err {
		return nil, err
	}

	videosDAL := videodal.NewNoActionVideoDAL()

	mediaFilesDAL := NewMediaFilesDAL(picturesBasePath, thumbnailsDAL, videosDAL)

	picturesDAL, err := NewPicturesDAL(picturesBasePath, cachesBasePath, mediaFilesDAL, thumbnailsDAL)
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
		NewTracksDAL(mediaFilesDAL),
		thumbnailsDAL,
	}, nil
}

var ErrContentTypeNotSupported = errors.New("content type not supported")

// Create adds a new picture to the collection
func (dal *MediaServerDAL) Create(file io.ReadSeeker, filename, contentType string, profileRun *profile.Run) (domain.MediaFile, error) {

	if dirtraversal.IsTryingToTraverseUp(filename) {
		return nil, ErrIllegalPathTraversingUp
	}

	relativeFolderPath := filepath.Join("uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	absoluteFilePath, relativePath, err := dal.getPathForNewFile(relativeFolderPath, filename)
	if nil != err {
		return nil, err
	}

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, err
	}

	fileLen, err := file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}

	doAtEnd := func() error { return nil }
	var mediaFile domain.MediaFile
	switch contentType {
	case "image/jpg", "image/jpeg", "image/png":
		var pictureMetadata *domain.PictureMetadata
		profileRun.Measure("generate picture metadata from bytes", func() {
			pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(file, relativePath, hashValue)
		})
		if nil != err {
			return nil, err
		}
		mediaFile = pictureMetadata

		doAtEnd = func() error {
			var err error
			profileRun.Measure("generate thumbnails for picture", func() {
				err = dal.ThumbnailsDAL.EnsureAllThumbnailsForPicture(
					pictureMetadata,
					dal.PicturesDAL.GetPicture,
				)
			})
			return err
		}
	case "video/mp4":
		videoFile := domain.NewVideoFileMetadata(hashValue, relativePath, fileLen)
		mediaFile = videoFile

		doAtEnd = func() error {
			return dal.VideosDAL.EnsureSupportedFile(videoFile)
		}
	case "application/octet-stream":
		// try parsing fit file
		mediaFileInfo := domain.NewMediaFileInfo(relativePath, hashValue, domain.MediaFileTypeFitTrack, fileLen)

		mediaFile, err = domain.NewFitFileSummaryFromReader(mediaFileInfo, file)
		if err != nil {
			return nil, err
		}

	default:
		log.Printf("content type not supported: %q\n", contentType)
		return nil, ErrContentTypeNotSupported
	}

	if nil != dal.MediaFilesDAL.Get(mediaFile.GetMediaFileInfo().HashValue) {
		return nil, ErrFileAlreadyExists
	}

	err = os.MkdirAll(filepath.Dir(absoluteFilePath), 0755)
	if nil != err {
		return nil, err
	}

	log.Println("writing to " + absoluteFilePath)

	newFile, err := os.Create(absoluteFilePath)
	if nil != err {
		return nil, err
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}

	_, err = io.Copy(newFile, file)
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
