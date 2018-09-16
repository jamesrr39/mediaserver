package pictureswebservice

import (
	"encoding/json"
	"fmt"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

type MediaFilesService struct {
	mediaServerDAL *picturesdal.MediaServerDAL
	dbConn         *mediaserverdb.DBConn
	chi.Router
}

func NewMediaFilesService(dbConn *mediaserverdb.DBConn, picturesDAL *picturesdal.MediaServerDAL) *MediaFilesService {
	router := chi.NewRouter()
	picturesService := &MediaFilesService{picturesDAL, dbConn, router}

	router.Get("/", picturesService.serveAllPicturesMetadata)
	router.Post("/", picturesService.servePictureUpload)

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
		mediaFiles = []pictures.MediaFile{}
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

func (ps *MediaFilesService) servePictureUpload(w http.ResponseWriter, r *http.Request) {

	file, fileHandler, err := r.FormFile("file")
	if nil != err {
		http.Error(w, err.Error(), 400)
		return
	}
	defer file.Close()

	contentType := fileHandler.Header.Get("Content-Type")

	pictureMetadata, err := ps.mediaServerDAL.Create(file, fileHandler.Filename, contentType)
	if nil != err {
		if picturesdal.ErrFileAlreadyExists == err {
			http.Error(w, err.Error(), 409)
			return
		}

		if picturesdal.ErrIllegalPathTraversingUp == err {
			http.Error(w, err.Error(), 400)
			return
		}

		http.Error(w, err.Error(), 500)
		return
	}

	render.JSON(w, r, pictureMetadata)
	return
}
