package pictureswebservice

import (
	"encoding/json"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"

	"github.com/gorilla/mux"
)

type PicturesMetadataService struct {
	picturesDAL *picturesdal.PicturesDAL
	Router      http.Handler
}

func NewPicturesMetadataService(picturesDAL *picturesdal.PicturesDAL) *PicturesMetadataService {
	picturesService := &PicturesMetadataService{picturesDAL: picturesDAL}

	router := mux.NewRouter()
	router.HandleFunc("/", picturesService.serveAllPicturesMetadata).Methods("GET")
	router.HandleFunc("/{hashValue}", picturesService.servePictureMetadata).Methods("GET")

	picturesService.Router = router
	return picturesService
}

func (ms *PicturesMetadataService) serveAllPicturesMetadata(w http.ResponseWriter, r *http.Request) {

	jsonBytes, err := json.Marshal(ms.picturesDAL.GetAll())
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonBytes)
}

func (ms *PicturesMetadataService) servePictureMetadata(w http.ResponseWriter, r *http.Request) {

	hashValue := mux.Vars(r)["hashValue"]
	pictureMetadata := ms.picturesDAL.Get(pictures.HashValue(hashValue))
	if nil == pictureMetadata {
		http.Error(w, "Couldn't find a picture for '"+hashValue+"'. Try rescanning the cache.", 404)
		return
	}

	jsonBytes, err := json.Marshal(pictureMetadata)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonBytes)
}
