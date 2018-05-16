package mediaserver

import (
	//	"log"

	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"mediaserverapp/mediaserver/pictureswebservice"
	"mediaserverapp/mediaserver/static_assets_handler"
	"path/filepath"

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
	dbConn                  *mediaserverdb.DBConn
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(rootpath, cachesDir, dataDir string, maxConcurrentResizes uint) (*MediaServer, error) {
	mediaServerDAL, err := picturesdal.NewMediaServerDAL(rootpath, cachesDir, dataDir, maxConcurrentResizes)
	if nil != err {
		return nil, err
	}

	dbConn, err := mediaserverdb.NewDBConn(filepath.Join(dataDir, "mediaserver.db"))
	if nil != err {
		return nil, err
	}

	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		mediaServerDAL:          mediaServerDAL,
		picturesService:         pictureswebservice.NewPicturesService(mediaServerDAL),
		picturesMetadataService: pictureswebservice.NewPicturesMetadataService(dbConn, mediaServerDAL),
	}

	tx, err := dbConn.Begin()
	if nil != err {
		return nil, err
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = mediaServer.mediaServerDAL.PicturesMetadataDAL.UpdatePicturesCache(tx)
	if nil != err {
		return nil, err
	}

	println("updated picture cache")
	// ensure thumbnails
	err = mediaServer.mediaServerDAL.PicturesDAL.EnsureAllThumbnailsForPictures(mediaServer.mediaServerDAL.PicturesMetadataDAL.GetAll())
	if err != nil {
		return nil, err
	}

	return mediaServer, nil
}

func (ms *MediaServer) Close() error {
	return ms.dbConn.Close()
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
	mainRouter.Mount("/", statichandlers.NewClientHandler())

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()
}
