package webservice

import (
	"fmt"
	"io"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/mediaserverjobs"
	"mime/multipart"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
)

type MediaFilesService struct {
	logger         *logpkg.Logger
	mediaServerDAL *dal.MediaServerDAL
	dbConn         *mediaserverdb.DBConn
	chi.Router
	profiler  *profile.Profiler
	jobRunner *mediaserverjobs.JobRunner
}

func NewMediaFilesService(logger *logpkg.Logger, dbConn *mediaserverdb.DBConn, picturesDAL *dal.MediaServerDAL, profiler *profile.Profiler, jobRunner *mediaserverjobs.JobRunner) *MediaFilesService {
	router := chi.NewRouter()
	fileService := &MediaFilesService{logger, picturesDAL, dbConn, router, profiler, jobRunner}

	router.Get("/", fileService.serveAllPicturesMetadata)
	router.Get("/{hash}", fileService.serveFile)
	router.Post("/", fileService.serveFileUpload)

	return fileService
}

func (ms *MediaFilesService) serveFile(w http.ResponseWriter, r *http.Request) {
	hash := chi.URLParam(r, "hash")
	if hash == "" {
		errorsx.HTTPError(w, ms.logger, errorsx.Errorf("no hash supplied"), http.StatusBadRequest)
		return
	}

	mediaFile := ms.mediaServerDAL.MediaFilesDAL.Get(domain.HashValue(hash))
	if mediaFile == nil {
		errorsx.HTTPError(w, ms.logger, errorsx.Errorf("hash %q not found", hash), http.StatusNotFound)
		return
	}

	file, err := ms.mediaServerDAL.MediaFilesDAL.OpenFile(mediaFile)
	if err != nil {
		errorsx.HTTPError(w, ms.logger, errorsx.Errorf("couldn't find file for hash %q, relative path %q. It should be present, however, as it was in the listing.", hash, mediaFile.GetMediaFileInfo().RelativePath), http.StatusInternalServerError)
		return
	}
	defer file.Close()

	_, err = io.Copy(w, file)
	if err != nil {
		errorsx.HTTPError(w, ms.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
}

func (ms *MediaFilesService) refresh(profileRun *profile.Run) errorsx.Error {
	tx, err := ms.dbConn.Begin()
	if nil != err {
		return errorsx.Errorf("couldn't open transaction to database. Error: %s", err)
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ms.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx, profileRun)
	if nil != err {
		return errorsx.Errorf("couldn't update pictures cache (refresh pictures library). Error: %s", err)
	}

	return nil
}

func (ms *MediaFilesService) serveAllPicturesMetadata(w http.ResponseWriter, r *http.Request) {
	profileRun := ms.profiler.NewRun("start serve all pictures metadata")
	defer ms.profiler.StopAndRecord(profileRun, "finished handling serve all pictures metadata")

	shouldRefresh := ("true" == r.URL.Query().Get("refresh"))
	if shouldRefresh {
		err := ms.refresh(profileRun)
		if err != nil {
			errorsx.HTTPError(w, ms.logger, err, 500)
			return
		}
	}

	mediaFiles := ms.mediaServerDAL.MediaFilesDAL.GetAll()
	if 0 == len(mediaFiles) {
		mediaFiles = []domain.MediaFile{}
	}

	w.Header().Set("etag", string(ms.mediaServerDAL.MediaFilesDAL.GetStateHashCode()))
	render.JSON(w, r, mediaFiles)
}

func (ms *MediaFilesService) serveFileUpload(w http.ResponseWriter, r *http.Request) {
	successfullyUploaded := false
	profileRun := ms.profiler.NewRun("upload file")
	defer ms.profiler.StopAndRecord(profileRun, fmt.Sprintf("successfully uploaded?: %t", successfullyUploaded))

	tx, err := ms.dbConn.Begin()
	if nil != err {
		errorsx.HTTPError(w, ms.logger, err, 500)
		return
	}
	defer mediaserverdb.CommitOrRollback(tx)

	var file multipart.File
	var fileHeader *multipart.FileHeader
	{
		var err error
		file, fileHeader, err = r.FormFile("file")
		if nil != err {
			errorsx.HTTPError(w, ms.logger, errorsx.Wrap(err), 400)
			return
		}
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")

	ms.profiler.Mark(profileRun, "start creating or getting file on disk")

	mediaFileInfo, err := ms.mediaServerDAL.CreateOrGetExisting(tx, file, fileHeader.Filename, contentType, profileRun)
	if nil != err {
		switch errorsx.Cause(err) {
		case dal.ErrIllegalPathTraversingUp:
			errorsx.HTTPError(w, ms.logger, err, 400)
		case dal.ErrContentTypeNotSupported:
			errorsx.HTTPError(w, ms.logger, err, 400)
		default:
			errorsx.HTTPError(w, ms.logger, err, 500)
		}
		return
	}

	ms.profiler.Mark(profileRun, "finish creating or getting file on disk")

	// queue jobs
	ms.jobRunner.QueueJob(
		mediaserverjobs.NewFileProcessorJob(mediaFileInfo, file, ms.mediaServerDAL, contentType, ms.profiler, profileRun, ms.dbConn),
		func() {
			ms.onSuccessfulFileProcess(mediaFileInfo, profileRun)
		},
	)

	successfullyUploaded = true

	render.JSON(w, r, mediaFileInfo)
	return
}

func (ms *MediaFilesService) onSuccessfulFileProcess(
	mediaFileInfo domain.MediaFileInfo,
	profileRun *profile.Run) {

	switch mediaFileInfo.MediaFileType {
	case domain.MediaFileTypePicture:
		pictureMetadata := ms.mediaServerDAL.MediaFilesDAL.Get(mediaFileInfo.HashValue).(*domain.PictureMetadata)

		ms.profiler.Mark(profileRun, "queuing job to generate thumbnails for picture")
		ms.jobRunner.QueueJob(mediaserverjobs.NewThumbnailResizerJob(
			pictureMetadata,
			ms.mediaServerDAL.PicturesDAL,
			ms.logger,
			ms.mediaServerDAL.ThumbnailsDAL,
		), nil)

		ms.profiler.Mark(profileRun, "queuing job to generate suggested locations for picture")

		ms.jobRunner.QueueJob(
			mediaserverjobs.NewApproximateLocationsJob(
				ms.mediaServerDAL.MediaFilesDAL,
				ms.mediaServerDAL.TracksDAL,
				[]*domain.PictureMetadata{pictureMetadata},
			), nil)
	case domain.MediaFileTypeFitTrack:
		ms.profiler.Mark(profileRun, "queuing job to generate suggested locations for picture")

		ms.jobRunner.QueueJob(
			mediaserverjobs.NewApproximateLocationsJob(
				ms.mediaServerDAL.MediaFilesDAL,
				ms.mediaServerDAL.TracksDAL,
				ms.mediaServerDAL.MediaFilesDAL.GetAllPictureMetadatas(),
			),
			nil)
	}
}
