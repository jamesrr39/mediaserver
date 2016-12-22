package pictureswebservice

import (
	"image/gif"  // decode
	"image/jpeg" // decode
	"image/png"  // decode
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"
	"strconv"

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

	picture, pictureType, err := ps.picturesDAL.GetRawPicture(pictureMetadata)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	picture, err = pictureMetadata.RotateAndTransformPictureByExifData(picture)
	if nil != err {
		http.Error(w, err.Error(), 500)
		return
	}

	widthParam := r.URL.Query().Get("w")
	heightParam := r.URL.Query().Get("h")
	sizeToResizeTo, err := widthAndHeightStringsToSize(widthParam, heightParam, pictures.Size{uint(picture.Bounds().Max.X), uint(picture.Bounds().Max.Y)})
	if nil != err {
		http.Error(w, err.Error(), 400)
		return
	}
	picture = pictures.ResizePicture(picture, sizeToResizeTo)

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

// widthAndHeightStringsToSize scales the maximum picture dimenions to the width and height URL Query parameters
// it will use the smallest size
// example: Picture 300w x 400h , widthParam "600" heightParam "900"
// resulting size: 600 x 800
// we won't size the picture up from the original picture size
func widthAndHeightStringsToSize(widthParam, heightParam string, pictureSize pictures.Size) (pictures.Size, error) {
	if "" == widthParam && "" == heightParam {
		return pictureSize, nil
	}

	var width, height int
	var err error
	if "" == widthParam {
		width = int(pictureSize.Width)
	} else {
		width, err = strconv.Atoi(widthParam)
		if nil != err {
			return pictures.Size{}, err
		}
	}

	if "" == heightParam {
		height = int(pictureSize.Height)
	} else {
		height, err = strconv.Atoi(heightParam)
		if nil != err {
			return pictures.Size{}, err
		}
	}

	// max allowed width; smallest from picture width or width from param
	maxAllowedWidth := int(pictureSize.Width)
	if width < maxAllowedWidth {
		maxAllowedWidth = width
	}

	// max allowed height; smallest from picture height or height from param
	maxAllowedHeight := int(pictureSize.Height)
	if height < maxAllowedHeight {
		maxAllowedHeight = height
	}

	widthRatio := float64(maxAllowedWidth) / float64(int(pictureSize.Width))
	heightRatio := float64(maxAllowedHeight) / float64(int(pictureSize.Height))

	smallestRatio := widthRatio
	if heightRatio < smallestRatio {
		smallestRatio = heightRatio
	}

	return pictures.Size{
		Width:  uint(float64(pictureSize.Width) * smallestRatio),
		Height: uint(float64(pictureSize.Height) * smallestRatio),
	}, nil
}
