package dal

import (
	"database/sql"
	"errors"
	"io"
	"log"
	"mediaserver/mediaserver/dal/videodal"
	"mediaserver/mediaserver/domain"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/jamesrr39/goutil/dirtraversal"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
)

var (
	ErrIllegalPathTraversingUp = errors.New("file path is traversing up")
)

type MediaServerDAL struct {
	fs             gofs.Fs
	Rootpath       string
	PicturesDAL    *PicturesDAL
	MediaFilesDAL  *MediaFilesDAL
	CollectionsDAL *CollectionsDAL
	VideosDAL      videodal.VideoDAL
	TracksDAL      *TracksDAL
	ThumbnailsDAL  *ThumbnailsDAL
	PeopleDAL      *PeopleDAL
	profiler       *profile.Profiler
}

func NewMediaServerDAL(
	logger *logpkg.Logger,
	fs gofs.Fs,
	profiler *profile.Profiler,
	picturesBasePath, cachesBasePath, dataDir string,
	maxConcurrentCPUJobs, maxConcurrentVideoConversions uint,
	thumbnailCachePolicy ThumbnailCachePolicy,
	maxConcurrentTrackRecordsParsing, maxConcurrentResizes uint,
) (*MediaServerDAL, error) {

	thumbnailsDAL, err := NewThumbnailsDAL(fs, logger, filepath.Join(cachesBasePath, "thumbnails"), thumbnailCachePolicy, profiler)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	videosDAL := videodal.NewNoActionVideoDAL()

	openFileFunc := func(mediaFile domain.MediaFile) (gofs.File, error) {
		return fs.Open(filepath.Join(picturesBasePath, mediaFile.GetMediaFileInfo().RelativePath))
	}

	picturesDAL := NewPicturesDAL(cachesBasePath, thumbnailsDAL, openFileFunc, maxConcurrentCPUJobs)
	tracksDAL := NewTracksDAL(openFileFunc, maxConcurrentTrackRecordsParsing)
	peopleDAL := NewPeopleDAL()

	mediaFilesDAL := NewMediaFilesDAL(logger, fs, profiler, picturesBasePath, thumbnailsDAL, videosDAL, picturesDAL, tracksDAL, peopleDAL)

	err = fs.MkdirAll(dataDir, 0700)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return &MediaServerDAL{
		fs,
		picturesBasePath,
		picturesDAL,
		mediaFilesDAL,
		NewCollectionsDAL(profiler),
		videosDAL,
		tracksDAL,
		thumbnailsDAL,
		peopleDAL,
		profiler,
	}, nil
}

var ErrContentTypeNotSupported = errors.New("content type not supported")

func (dal *MediaServerDAL) CreateOrGetExisting(tx *sql.Tx, file io.ReadSeeker, filename, contentType string, profileRun *profile.Run) (domain.MediaFileInfo, errorsx.Error) {
	dal.profiler.Mark(profileRun, "start creating or get existing file")
	defer dal.profiler.Mark(profileRun, "finish creating or get existing file")

	dal.profiler.Mark(profileRun, "calculating hash")

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "checking for existing file")

	existingFile := dal.MediaFilesDAL.Get(hashValue)
	if existingFile != nil {
		return existingFile.GetMediaFileInfo(), nil
	}

	absoluteFilePath, relativePath, err := dal.getPathForNewFile(filename)
	if err != nil {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "seeking to start of file")

	fileLen, err := file.Seek(0, io.SeekStart)
	if err != nil {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "file type specific action")

	participantIDs, err := dal.MediaFilesDAL.peopleDAL.GetPeopleIDsInMediaFile(tx, hashValue)
	if nil != err {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "making uploads dir if necessary")

	err = dal.fs.MkdirAll(filepath.Dir(absoluteFilePath), 0755)
	if nil != err {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	log.Println("writing to " + absoluteFilePath)

	newFile, err := dal.fs.Create(absoluteFilePath)
	if nil != err {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}
	defer newFile.Close()

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "writing new file")

	_, err = io.Copy(newFile, file)
	if nil != err {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return domain.MediaFileInfo{}, errorsx.Wrap(err)
	}

	osFileInfo, err := dal.fs.Stat(absoluteFilePath)

	mediaFileInfo := domain.NewMediaFileInfo(relativePath, hashValue, domain.MediaFileTypeFitTrack, fileLen, participantIDs, osFileInfo.ModTime(), osFileInfo.Mode())

	return mediaFileInfo, nil
}

func (dal *MediaServerDAL) getPathForNewFile(filename string) (string, string, error) {
	if dirtraversal.IsTryingToTraverseUp(filename) {
		return "", "", errorsx.Wrap(ErrIllegalPathTraversingUp)
	}

	relativeFolderPath := filepath.Join("uploads", time.Now().Format("2006-01-02"))

	fileExtension := filepath.Ext(filename)
	withoutExtension := strings.TrimSuffix(filename, fileExtension)

	for i := 0; i < 100000; i++ {
		name := withoutExtension
		if 0 != i {
			name += "_" + strconv.Itoa(i)
		}
		name += fileExtension

		relativePath := filepath.Join(relativeFolderPath, name)
		absolutePath := filepath.Join(dal.Rootpath, relativePath)
		_, err := dal.fs.Stat(absolutePath)
		if nil != err {
			if os.IsNotExist(err) {
				return absolutePath, relativePath, nil
			}
			return "", "", errorsx.Wrap(err)
		}
	}
	return "", "", errors.New("ran out of numbers for the new file")
}
