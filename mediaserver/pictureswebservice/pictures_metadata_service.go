package pictureswebservice

import (
	"encoding/json"
	"fmt"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"

	"github.com/go-chi/chi"
)

type PicturesMetadataService struct {
	picturesDAL *picturesdal.MediaServerDAL
	http.Handler
}

func NewPicturesMetadataService(picturesDAL *picturesdal.MediaServerDAL) *PicturesMetadataService {
	router := chi.NewRouter()
	picturesService := &PicturesMetadataService{picturesDAL, router}

	router.Get("/", picturesService.serveAllPicturesMetadata)

	return picturesService
}

func (ms *PicturesMetadataService) serveAllPicturesMetadata(w http.ResponseWriter, r *http.Request) {
	shouldRefresh := ("true" == r.URL.Query().Get("refresh"))
	if shouldRefresh {
		err := ms.picturesDAL.PicturesMetadataDAL.UpdatePicturesCache()
		if nil != err {
			http.Error(w, fmt.Sprintf("couldn't update pictures cache (refresh pictures library). Error: %s", err), 500)
			return
		}
	}

	picturesMetadata := ms.picturesDAL.PicturesMetadataDAL.GetAll()
	if 0 == len(picturesMetadata) {
		picturesMetadata = []*pictures.PictureMetadata{}
	}

	jsonBytes, err := json.Marshal(picturesMetadata)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("etag", string(ms.picturesDAL.PicturesMetadataDAL.GetStateHashCode()))
	w.Write(jsonBytes)
}
