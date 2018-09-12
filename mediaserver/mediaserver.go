package mediaserver

import (
	//	"log"

	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"mediaserverapp/mediaserver/pictureswebservice"
	"mediaserverapp/mediaserver/static_assets_handler"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/jamesrr39/goutil/httpextra"
	"github.com/jamesrr39/goutil/logger"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath                string
	mediaServerDAL          *picturesdal.MediaServerDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.PicturesMetadataService
	filesWebService         *pictureswebservice.FileWebService
	collectionsService      *pictureswebservice.CollectionsWebService
	dbConn                  *mediaserverdb.DBConn
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(rootpath, cachesDir, dataDir string, maxConcurrentResizes uint) (*MediaServer, error) {
	mediaServerDAL, err := picturesdal.NewMediaServerDAL(rootpath, cachesDir, dataDir, maxConcurrentResizes)
	if nil != err {
		return nil, err
	}

	dbConn, err := mediaserverdb.NewDBConn(filepath.Join(dataDir, "mediaserver.db"), logger.NewLogger(os.Stdout, logger.LogLevelInfo))
	if nil != err {
		return nil, err
	}

	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		mediaServerDAL:          mediaServerDAL,
		picturesService:         pictureswebservice.NewPicturesService(mediaServerDAL),
		picturesMetadataService: pictureswebservice.NewPicturesMetadataService(dbConn, mediaServerDAL),
		filesWebService:         pictureswebservice.NewFileWebService(mediaServerDAL),
		collectionsService:      pictureswebservice.NewCollectionsWebService(dbConn, mediaServerDAL.CollectionsDAL),
	}

	tx, err := dbConn.Begin()
	if nil != err {
		return nil, err
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = mediaServer.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx)
	if nil != err {
		return nil, err
	}

	// ensure thumbnails
	mediaFiles := mediaServer.mediaServerDAL.MediaFilesDAL.GetAll()

	err = mediaServer.mediaServerDAL.PicturesDAL.EnsureAllThumbnailsForPictures(pictures.GetPicturesMetadatasFromMediaFileList(mediaFiles))
	if err != nil {
		return nil, err
	}

	return mediaServer, nil
}

func (ms *MediaServer) Close() error {
	return ms.dbConn.Close()
}

// scans for pictures and serves http server
func (ms *MediaServer) ListenAndServe(addr string) error {

	mainRouter := chi.NewRouter()
	mainRouter.Use(cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	}).Handler)

	mainRouter.Route("/api/", func(r chi.Router) {
		r.Mount("/files/", ms.picturesMetadataService)
		r.Mount("/collections/", ms.collectionsService)
	})

	mainRouter.Mount("/file/", http.StripPrefix("/file/", ms.filesWebService))
	mainRouter.Mount("/picture/", ms.picturesService)
	mainRouter.Mount("/", statichandlers.NewClientHandler())

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()
}
