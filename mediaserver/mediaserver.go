package mediaserver

import (
	//	"log"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/pictureswebservice"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jamesrr39/goutil/httpextra"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath                string
	mediaServerDAL          *picturesdal.MediaServerDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.PicturesMetadataService
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(rootpath, cachesDir string) (*MediaServer, error) {
	mediaServerDAL, err := picturesdal.NewMediaServerDAL(rootpath, cachesDir)
	if nil != err {
		return nil, err
	}

	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		mediaServerDAL:          mediaServerDAL,
		picturesService:         pictureswebservice.NewPicturesService(mediaServerDAL),
		picturesMetadataService: pictureswebservice.NewPicturesMetadataService(mediaServerDAL),
	}

	err = mediaServer.mediaServerDAL.PicturesMetadataDAL.UpdatePicturesCache()
	if nil != err {
		return nil, err
	}

	return mediaServer, nil
}

// scans for pictures and serves http server
func (ms *MediaServer) ServeHTTP(addr string) error {

	mainRouter := mux.NewRouter()

	mainRouter.PathPrefix("/api/pictureMetadata/").Handler(http.StripPrefix("/api/pictureMetadata", ms.picturesMetadataService.Router))
	mainRouter.PathPrefix("/picture/").Handler(http.StripPrefix("/picture", ms.picturesService.Router))
	mainRouter.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("client"))))

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()

}
