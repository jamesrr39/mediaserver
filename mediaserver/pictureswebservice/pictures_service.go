package pictureswebservice

import (
	"fmt"
	"io"
	"log"

	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

type PicturesService struct {
	mediaServerDAL *picturesdal.MediaServerDAL
	http.Handler
}

func NewPicturesService(mediaServerDAL *picturesdal.MediaServerDAL) *PicturesService {
	router := chi.NewRouter()

	picturesService := &PicturesService{mediaServerDAL, router}

	router.Get("/{hash}", picturesService.servePicture)
	router.Post("/", picturesService.servePictureUpload)

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

	mediaFile := ps.mediaServerDAL.PicturesMetadataDAL.Get(pictures.HashValue(hash))
	if mediaFile == nil || mediaFile.GetMediaFileType() != pictures.MediaFileTypePicture {
		http.Error(w, "picture not found for this hash", 404)
		return
	}
	pictureMetadata := mediaFile.(*pictures.PictureMetadata)

	sizeToResizeTo, err := pictures.WidthAndHeightStringsToSize(
		width,
		height,
		pictures.Size{
			Width:  uint(pictureMetadata.RawSize.Width),
			Height: uint(pictureMetadata.RawSize.Height),
		})
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	pictureReader, pictureFormat, err := ps.mediaServerDAL.PicturesDAL.GetPictureBytes(pictures.HashValue(hash), sizeToResizeTo)
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
	defer file.Close()

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

	render.JSON(w, r, pictureMetadata)
}
