package pictureswebservice

import (
	"image"
	"image/gif"  // decode
	"image/jpeg" // decode
	"image/png"  // decode
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

type PicturesService struct {
	picturesDAL *picturesdal.PicturesDAL
	Router      http.Handler
}

func NewPicturesService(picturesDAL *picturesdal.PicturesDAL) *PicturesService {
	picturesService := &PicturesService{picturesDAL: picturesDAL}

	router := mux.NewRouter()
	router.HandleFunc("/{hashValue}", picturesService.servePicture).Methods("GET")

	picturesService.Router = router
	return picturesService
}

func (ps *PicturesService) servePicture(w http.ResponseWriter, r *http.Request) {
	hashValue := mux.Vars(r)["hashValue"]
	pictureMetadata := ps.picturesDAL.Get(pictures.HashValue(hashValue))
	if pictureMetadata == nil {
		http.Error(w, "Couldn't find a picture for '"+hashValue+"'. Try rescanning the cache.", 404)
		return
	}

	pictureFile, err := os.Open(pictureMetadata.RelativeFilePath)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}
	defer pictureFile.Close()
	picture, pictureType, err := image.Decode(pictureFile)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	switch pictureType {
	case "jpeg":
		jpeg.Encode(w, picture, nil)
		w.Header().Set("Content-Type", "image/jpeg")
		return
	case "png":
		png.Encode(w, picture)
		w.Header().Set("Content-Type", "image/png")
		return
	case "gif":
		gif.Encode(w, picture, nil)
		w.Header().Set("Content-Type", "image/gif")
		return
	default:
		http.Error(w, "Image type not supported: '"+pictureType+"'", 415)
		return
	}

}
