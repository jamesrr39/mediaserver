package pictureswebservice

import (
	"encoding/json"
	"fmt"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"net/http"

	"github.com/go-chi/chi"
)

type PicturesMetadataService struct {
	picturesDAL *picturesdal.MediaServerDAL
	dbConn      *mediaserverdb.DBConn
	http.Handler
}

func NewPicturesMetadataService(dbConn *mediaserverdb.DBConn, picturesDAL *picturesdal.MediaServerDAL) *PicturesMetadataService {
	router := chi.NewRouter()
	picturesService := &PicturesMetadataService{picturesDAL, dbConn, router}

	router.Get("/", picturesService.serveAllPicturesMetadata)

	return picturesService
}

func (ms *PicturesMetadataService) serveAllPicturesMetadata(w http.ResponseWriter, r *http.Request) {
	shouldRefresh := ("true" == r.URL.Query().Get("refresh"))
	if shouldRefresh {
		tx, err := ms.dbConn.Begin()
		if nil != err {
			http.Error(w, fmt.Sprintf("couldn't open transaction to database. Error: %s", err), 500)
			return
		}
		defer mediaserverdb.CommitOrRollback(tx)

		err = ms.picturesDAL.PicturesMetadataDAL.UpdatePicturesCache(tx)
		if nil != err {
			http.Error(w, fmt.Sprintf("couldn't update pictures cache (refresh pictures library). Error: %s", err), 500)
			return
		}
	}

	mediaFiles := ms.picturesDAL.PicturesMetadataDAL.GetAll()
	if 0 == len(mediaFiles) {
		mediaFiles = []pictures.MediaFile{}
	}

	jsonBytes, err := json.Marshal(mediaFiles)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("etag", string(ms.picturesDAL.PicturesMetadataDAL.GetStateHashCode()))
	w.Write(jsonBytes)
}
