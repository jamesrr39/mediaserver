package mediaserver

import (
	//	"log"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/pictureswebservice"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
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

	mainRouter := chi.NewRouter()
	mainRouter.Use(cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	}).Handler)

	mainRouter.Route("/api/", func(r chi.Router) {
		r.Mount("/pictureMetadata/", ms.picturesMetadataService)
	})

	mainRouter.Mount("/picture/", ms.picturesService)

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()
}
