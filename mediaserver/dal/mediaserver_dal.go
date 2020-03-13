package dal

import (
	"database/sql"
	"errors"
	"io"
	"log"
	"mediaserver/mediaserver/dal/videodal"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/mediaserverjobs"
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
	jobRunner *mediaserverjobs.JobRunner,
) (*MediaServerDAL, error) {

	thumbnailsDAL, err := NewThumbnailsDAL(fs, logger, filepath.Join(cachesBasePath, "thumbnails"), jobRunner, thumbnailCachePolicy, profiler)
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

	mediaFilesDAL := NewMediaFilesDAL(logger, fs, profiler, picturesBasePath, thumbnailsDAL, videosDAL, picturesDAL, jobRunner, tracksDAL, peopleDAL)

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

// Create adds a new picture to the collection
func (dal *MediaServerDAL) CreateOrGetExisting(tx *sql.Tx, file io.ReadSeeker, filename, contentType string, profileRun *profile.Run) (domain.MediaFile, errorsx.Error) {
	dal.profiler.Mark(profileRun, "start creating or get existing file")
	defer dal.profiler.Mark(profileRun, "finish creating or get existing file")

	if dirtraversal.IsTryingToTraverseUp(filename) {
		return nil, errorsx.Wrap(ErrIllegalPathTraversingUp)
	}

	relativeFolderPath := filepath.Join("uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	absoluteFilePath, relativePath, err := dal.getPathForNewFile(relativeFolderPath, filename)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "calculating hash")

	hashValue, err := domain.NewHash(file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "checking for existing file")

	existingFile := dal.MediaFilesDAL.Get(hashValue)
	if existingFile != nil {
		return existingFile, nil
	}

	dal.profiler.Mark(profileRun, "seeking to start of file")

	fileLen, err := file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "file type specific action")

	participantIDs, err := dal.MediaFilesDAL.peopleDAL.GetPeopleIDsInMediaFile(tx, hashValue)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "making uploads dir if necessary")

	err = dal.fs.MkdirAll(filepath.Dir(absoluteFilePath), 0755)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	log.Println("writing to " + absoluteFilePath)

	newFile, err := dal.fs.Create(absoluteFilePath)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	defer newFile.Close()

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "writing new file")

	_, err = io.Copy(newFile, file)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	osFileInfo, err := dal.fs.Stat(absoluteFilePath)

	mediaFileInfo := domain.NewMediaFileInfo(relativePath, hashValue, domain.MediaFileTypeFitTrack, fileLen, participantIDs, osFileInfo.ModTime(), osFileInfo.Mode())

	doAtEnd := func() error { return nil }
	var mediaFile domain.MediaFile

	switch contentType {
	case "image/jpg", "image/jpeg", "image/png":
		var pictureMetadata *domain.PictureMetadata
		dal.profiler.Mark(profileRun, "generate picture metadata from bytes")
		pictureMetadata, _, err = domain.NewPictureMetadataAndPictureFromBytes(file, mediaFileInfo)
		if nil != err {
			return nil, errorsx.Wrap(err)
		}

		err = dal.PicturesDAL.CreatePictureMetadata(tx, pictureMetadata)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		mediaFile = pictureMetadata

		doAtEnd = func() error {
			dal.profiler.Mark(profileRun, "generate thumbnails for picture")
			err := dal.ThumbnailsDAL.QueueThumbnailCreationForPicture(
				profileRun,
				pictureMetadata,
				dal.PicturesDAL.GetPicture,
			)

			if err != nil {
				return errorsx.Wrap(err)
			}

			dal.profiler.Mark(profileRun, "generate suggested locations for picture")

			dal.MediaFilesDAL.jobRunner.QueueJob(
				mediaserverjobs.NewApproximateLocationsJob(
					dal.MediaFilesDAL.GetAll,
					dal.MediaFilesDAL.tracksDAL.GetRecords,
					[]*domain.PictureMetadata{pictureMetadata},
				),
			)

			return nil
		}
	case "video/mp4":
		videoFile := domain.NewVideoFileMetadata(mediaFileInfo)
		mediaFile = videoFile

		doAtEnd = func() error {
			return dal.VideosDAL.EnsureSupportedFile(videoFile)
		}
	case "application/octet-stream":
		// try parsing fit file

		fitFileSummary, err := domain.NewFitFileSummaryFromReader(mediaFileInfo, file)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
		mediaFile = fitFileSummary

		doAtEnd = func() error {
			dal.profiler.Mark(profileRun, "generate suggested locations for picture")

			// suggested locations job
			var pictureMetadatas []*domain.PictureMetadata
			for _, mediaFile := range dal.MediaFilesDAL.GetAll() {
				switch castedMediaFile := mediaFile.(type) {
				case *domain.PictureMetadata:
					pictureMetadatas = append(pictureMetadatas, castedMediaFile)
				}
			}

			dal.MediaFilesDAL.jobRunner.QueueJob(
				mediaserverjobs.NewApproximateLocationsJob(
					func() []domain.MediaFile { return []domain.MediaFile{fitFileSummary} },
					dal.MediaFilesDAL.tracksDAL.GetRecords,
					dal.MediaFilesDAL.GetAllPictureMetadatas(),
				),
			)

			return nil
		}

	default:
		log.Printf("content type not supported: %q\n", contentType)
		err = os.Remove(absoluteFilePath)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
		return nil, errorsx.Wrap(ErrContentTypeNotSupported)
	}

	dal.profiler.Mark(profileRun, "doing action at end")

	err = doAtEnd()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dal.profiler.Mark(profileRun, "adding file to mediafiles")

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
		_, err := dal.fs.Stat(path)
		if nil != err {
			if os.IsNotExist(err) {
				return path, relativePath, nil
			}
			return "", "", errorsx.Wrap(err)
		}
	}
	return "", "", errors.New("ran out of numbers for the new file")
}
