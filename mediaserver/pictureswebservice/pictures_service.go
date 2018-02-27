package pictureswebservice

import (
	"encoding/json"
	"fmt"
	"io"
	"log"

	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"

	"github.com/gorilla/mux"
)

type PicturesService struct {
	mediaServerDAL *picturesdal.MediaServerDAL
	Router         http.Handler
}

func NewPicturesService(picturesDAL *picturesdal.MediaServerDAL) *PicturesService {
	picturesService := &PicturesService{mediaServerDAL: picturesDAL}

	router := mux.NewRouter()
	router.HandleFunc("/{hashValue}", picturesService.servePicture).Methods("GET")
	router.HandleFunc("/", picturesService.servePictureUpload).Methods("POST")

	picturesService.Router = router
	return picturesService
}

func (ps *PicturesService) servePicture(w http.ResponseWriter, r *http.Request) {

	hash := mux.Vars(r)["hashValue"]
	width := r.URL.Query().Get("w")
	height := r.URL.Query().Get("h")

	pictureReader, pictureFormat, err := ps.mediaServerDAL.PicturesDAL.GetPictureBytes(pictures.HashValue(hash), width, height)
	if nil != err {
		switch err {
		case picturesdal.ErrHashNotFound:
			http.Error(w, "picture not found for this hash", 404)
			return
		default:
			http.Error(w, fmt.Sprintf("failed get picture for hash '%s'. Error: '%s'", hash, err), 500)
			return
		}
	}

	switch pictureFormat {
	case "jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case "png":
		w.Header().Set("Content-Type", "image/png")
	case "gif":
		w.Header().Set("Content-Type", "image/gif")
	default:
		http.Error(w, fmt.Sprintf("Image type not supported: '%s'", pictureFormat), 415)
		return
	}

	_, err = io.Copy(w, pictureReader)
	if nil != err {
		errMessage := fmt.Errorf("ERROR writing bytes to response for hash '%s'. Error: '%s'", hash, err)
		log.Println(errMessage)
		http.Error(w, errMessage.Error(), 500)
		return
	}
}

func (ps *PicturesService) servePictureUpload(w http.ResponseWriter, r *http.Request) {

	file, fileHandler, err := r.FormFile("file")
	if nil != err {
		http.Error(w, err.Error(), 400)
		return
	}

	pictureMetadata, err := ps.mediaServerDAL.Create(file, fileHandler.Filename, fileHandler.Header.Get("Content-Type"))
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

	metadataBytes, err := json.Marshal(pictureMetadata)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(metadataBytes)

}
