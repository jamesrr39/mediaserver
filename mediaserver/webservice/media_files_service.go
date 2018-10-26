package webservice

import (
	"encoding/json"
	"fmt"
	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserverapp/mediaserver/domain"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

type MediaFilesService struct {
	mediaServerDAL *dal.MediaServerDAL
	dbConn         *mediaserverdb.DBConn
	chi.Router
}

func NewMediaFilesService(dbConn *mediaserverdb.DBConn, picturesDAL *dal.MediaServerDAL) *MediaFilesService {
	router := chi.NewRouter()
	picturesService := &MediaFilesService{picturesDAL, dbConn, router}

	router.Get("/", picturesService.serveAllPicturesMetadata)
	router.Post("/", picturesService.serveFileUpload)

	return picturesService
}

func (ms *MediaFilesService) refresh() error {
	tx, err := ms.dbConn.Begin()
	if nil != err {
		return fmt.Errorf("couldn't open transaction to database. Error: %s", err)
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ms.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx)
	if nil != err {
		return fmt.Errorf("couldn't update pictures cache (refresh pictures library). Error: %s", err)
	}

	return nil
}

func (ms *MediaFilesService) serveAllPicturesMetadata(w http.ResponseWriter, r *http.Request) {
	shouldRefresh := ("true" == r.URL.Query().Get("refresh"))
	if shouldRefresh {
		err := ms.refresh()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
	}

	mediaFiles := ms.mediaServerDAL.MediaFilesDAL.GetAll()
	if 0 == len(mediaFiles) {
		mediaFiles = []domain.MediaFile{}
	}

	jsonBytes, err := json.Marshal(mediaFiles)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("etag", string(ms.mediaServerDAL.MediaFilesDAL.GetStateHashCode()))
	w.Write(jsonBytes)
}

func (ps *MediaFilesService) serveFileUpload(w http.ResponseWriter, r *http.Request) {

	file, fileHandler, err := r.FormFile("file")
	if nil != err {
		http.Error(w, err.Error(), 400)
		return
	}
	defer file.Close()

	contentType := fileHandler.Header.Get("Content-Type")

	mediaFile, err := ps.mediaServerDAL.Create(file, fileHandler.Filename, contentType)
	if nil != err {
		switch err {
		case dal.ErrFileAlreadyExists:
			http.Error(w, err.Error(), 409)
		case dal.ErrIllegalPathTraversingUp:
			http.Error(w, err.Error(), 400)
		case dal.ErrContentTypeNotSupported:
			http.Error(w, err.Error(), 400)
		default:
			http.Error(w, err.Error(), 500)
		}
		return
	}

	render.JSON(w, r, mediaFile)
	return
}
