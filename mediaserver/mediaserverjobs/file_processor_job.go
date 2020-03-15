package mediaserverjobs

import (
	"fmt"
	"io"
	"log"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/profile"
)

type FileProcessorJob struct {
	mediaFileInfo domain.MediaFileInfo
	file          io.ReadSeeker
	dal           *dal.MediaServerDAL
	contentType   string
	profiler      *profile.Profiler
	profileRun    *profile.Run
	dbConn        *mediaserverdb.DBConn
}

func NewFileProcessorJob(mediaFileInfo domain.MediaFileInfo, file io.ReadSeeker, dal *dal.MediaServerDAL, contentType string,
	profiler *profile.Profiler, profileRun *profile.Run,
	dbConn *mediaserverdb.DBConn) *FileProcessorJob {
	return &FileProcessorJob{mediaFileInfo, file, dal, contentType, profiler, profileRun, dbConn}
}

func (j *FileProcessorJob) processImage() (domain.MediaFile, errorsx.Error) {
	j.profiler.Mark(j.profileRun, "generate picture metadata from bytes")
	pictureMetadata, _, err := domain.NewPictureMetadataAndPictureFromBytes(j.file, j.mediaFileInfo)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return pictureMetadata, nil
}

func (j *FileProcessorJob) run() errorsx.Error {

	var mediaFile domain.MediaFile
	var err error

	switch j.contentType {
	case "image/jpg", "image/jpeg", "image/png":
		mediaFile, err = j.processImage()
		if err != nil {
			return errorsx.Wrap(err)
		}
	case "video/mp4":
		videoFile := domain.NewVideoFileMetadata(j.mediaFileInfo)

		mediaFile = videoFile
	case "application/octet-stream":
		// try parsing fit file
		fitFileSummary, err := domain.NewFitFileSummaryFromReader(j.mediaFileInfo, j.file)
		if err != nil {
			return errorsx.Wrap(err)
		}
		mediaFile = fitFileSummary

	default:
		log.Printf("content type not supported: %q. Filepath: %q\n", j.contentType, j.mediaFileInfo.RelativePath)

		return errorsx.Wrap(dal.ErrContentTypeNotSupported)
	}

	j.profiler.Mark(j.profileRun, "adding file to mediafiles")

	tx, err := j.dbConn.Begin()
	if nil != err {
		return errorsx.Wrap(err)
	}
	defer tx.Rollback()

	err = j.dal.MediaFilesDAL.Add(tx, mediaFile)
	if err != nil {
		return errorsx.Wrap(err)
	}

	err = tx.Commit()
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}

func (j *FileProcessorJob) String() string {
	return fmt.Sprintf(
		"file processing for %s (%q)",
		j.mediaFileInfo.HashValue,
		j.mediaFileInfo.RelativePath,
	)
}

func (j *FileProcessorJob) Name() string {
	return "file_processor_job"
}

func (j *FileProcessorJob) JobType() JobType {
	return JobTypeCPUJob
}
