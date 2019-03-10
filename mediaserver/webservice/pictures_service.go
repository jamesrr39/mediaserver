package webservice

import (
	"io"
	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/domain"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logger"
)

type PicturesService struct {
	log            *logger.Logger
	mediaServerDAL *dal.MediaServerDAL
	http.Handler
}

func NewPicturesService(log *logger.Logger, mediaServerDAL *dal.MediaServerDAL) *PicturesService {
	router := chi.NewRouter()

	picturesService := &PicturesService{log, mediaServerDAL, router}

	router.Get("/{hash}", picturesService.servePicture)

	return picturesService
}

func (ps *PicturesService) servePicture(w http.ResponseWriter, r *http.Request) {

	hash := chi.URLParam(r, "hash")
	if "" == hash {
		errorsx.HTTPError(w, ps.log, errorsx.Errorf(http.StatusText(422)), 422)
		return
	}
	width := r.URL.Query().Get("w")
	height := r.URL.Query().Get("h")

	mediaFile := ps.mediaServerDAL.MediaFilesDAL.Get(domain.HashValue(hash))
	if mediaFile == nil || mediaFile.GetMediaFileInfo().MediaFileType != domain.MediaFileTypePicture {
		errorsx.HTTPError(w, ps.log, errorsx.Wrap(dal.ErrHashNotFound), 404)
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
		errorsx.HTTPError(w, ps.log, err, 500)
		return
	}

	pictureReader, pictureFormat, err := ps.mediaServerDAL.PicturesDAL.GetPictureBytes(pictureMetadata, sizeToResizeTo)
	if nil != err {
		switch err {
		case dal.ErrHashNotFound:
			errorsx.HTTPError(w, ps.log, errorsx.Wrap(dal.ErrNotFound), 404)
			return
		default:
			errorsx.HTTPError(w, ps.log, err, 500)
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
		errorsx.HTTPError(w, ps.log, errorsx.Errorf("Image type not supported: '%s'", pictureFormat), 415)
		return
	}

	{
		_, err := io.Copy(w, pictureReader)
		if nil != err {
			errorsx.HTTPError(w, ps.log, errorsx.Wrap(err), 500)
			return
		}
	}
}
