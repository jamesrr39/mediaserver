package mediaserver

import (
	//	"log"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/pictureswebservice"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/goutil/httpextra"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath                string
	picturesDAL             *picturesdal.PicturesDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.PicturesMetadataService
}

// NewMediaServer creates a new MediaServer
func NewMediaServer(rootpath string) *MediaServer {
	picturesDAL := picturesdal.NewPicturesDAL(rootpath)
	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		picturesDAL:             picturesDAL,
		picturesService:         pictureswebservice.NewPicturesService(picturesDAL),
		picturesMetadataService: pictureswebservice.NewPicturesMetadataService(picturesDAL),
	}
	return mediaServer
}

// scans for pictures and serves http server
func (ms *MediaServer) ServeHTTP(port int) error {

	err := ms.picturesDAL.UpdatePicturesCache()
	if nil != err {
		return err
	}

	mainRouter := mux.NewRouter()

	mainRouter.PathPrefix("/api/pictureMetadata/").Handler(http.StripPrefix("/api/pictureMetadata", ms.picturesMetadataService.Router))
	mainRouter.PathPrefix("/picture/").Handler(http.StripPrefix("/picture", ms.picturesService.Router))
	mainRouter.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("client"))))

	server := httpextra.NewServerWithTimeouts()
	server.Addr = "localhost:" + strconv.Itoa(port)
	server.Handler = mainRouter
	return server.ListenAndServe()

}
