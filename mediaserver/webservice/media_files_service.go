package webservice

import (
	"fmt"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"mime/multipart"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
)

type MediaFilesService struct {
	log            *logpkg.Logger
	mediaServerDAL *dal.MediaServerDAL
	dbConn         *mediaserverdb.DBConn
	chi.Router
	profiler *profile.Profiler
}

func NewMediaFilesService(log *logpkg.Logger, dbConn *mediaserverdb.DBConn, picturesDAL *dal.MediaServerDAL, profiler *profile.Profiler) *MediaFilesService {
	router := chi.NewRouter()
	picturesService := &MediaFilesService{log, picturesDAL, dbConn, router, profiler}

	router.Get("/", picturesService.serveAllPicturesMetadata)
	router.Post("/", picturesService.serveFileUpload)

	return picturesService
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
	profileRun := ms.profiler.NewRun("serve all pictures metadata")
	defer func() {
		profileRun.Record("")
	}()

	shouldRefresh := ("true" == r.URL.Query().Get("refresh"))
	if shouldRefresh {
		err := ms.refresh(profileRun)
		if err != nil {
			errorsx.HTTPError(w, ms.log, err, 500)
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
	defer func() {
		profileRun.Record(fmt.Sprintf("successfully uploaded: %t", successfullyUploaded))
	}()

	tx, err := ms.dbConn.Begin()
	if nil != err {
		errorsx.HTTPError(w, ms.log, err, 500)
		return
	}
	defer mediaserverdb.CommitOrRollback(tx)

	var file multipart.File
	var fileHeader *multipart.FileHeader
	{
		var err error
		file, fileHeader, err = r.FormFile("file")
		if nil != err {
			errorsx.HTTPError(w, ms.log, errorsx.Wrap(err), 400)
			return
		}
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")

	mediaFile, err := ms.mediaServerDAL.Create(tx, file, fileHeader.Filename, contentType, profileRun)
	if nil != err {
		switch errorsx.Cause(err) {
		case dal.ErrFileAlreadyExists:
			errorsx.HTTPError(w, ms.log, err, 409)
		case dal.ErrIllegalPathTraversingUp:
			errorsx.HTTPError(w, ms.log, err, 400)
		case dal.ErrContentTypeNotSupported:
			errorsx.HTTPError(w, ms.log, err, 400)
		default:
			errorsx.HTTPError(w, ms.log, err, 500)
		}
		return
	}

	successfullyUploaded = true

	render.JSON(w, r, mediaFile)
	return
}
