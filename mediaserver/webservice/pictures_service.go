package webservice

import (
	"fmt"
	"io"
	"log"
	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/domain"
	"net/http"

	"github.com/go-chi/chi"
)

type PicturesService struct {
	mediaServerDAL *dal.MediaServerDAL
	http.Handler
}

func NewPicturesService(mediaServerDAL *dal.MediaServerDAL) *PicturesService {
	router := chi.NewRouter()

	picturesService := &PicturesService{mediaServerDAL, router}

	router.Get("/{hash}", picturesService.servePicture)

	return picturesService
}

func (ps *PicturesService) servePicture(w http.ResponseWriter, r *http.Request) {

	hash := chi.URLParam(r, "hash")
	if "" == hash {
		http.Error(w, http.StatusText(422), 422)
		return
	}
	width := r.URL.Query().Get("w")
	height := r.URL.Query().Get("h")

	mediaFile := ps.mediaServerDAL.MediaFilesDAL.Get(domain.HashValue(hash))
	if mediaFile == nil || mediaFile.GetMediaFileInfo().MediaFileType != domain.MediaFileTypePicture {
		http.Error(w, "picture not found for this hash", 404)
		return
	}
	pictureMetadata := mediaFile.(*domain.PictureMetadata)

	sizeToResizeTo, err := domain.WidthAndHeightStringsToSize(
		width,
		height,
		domain.Size{
			Width:  uint(pictureMetadata.RawSize.Width),
			Height: uint(pictureMetadata.RawSize.Height),
		})
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	pictureReader, pictureFormat, err := ps.mediaServerDAL.PicturesDAL.GetPictureBytes(pictureMetadata, sizeToResizeTo)
	if nil != err {
		switch err {
		case dal.ErrHashNotFound:
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
