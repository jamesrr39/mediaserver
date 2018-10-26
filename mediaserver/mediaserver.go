package mediaserver

import (
	//	"log"

	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/static_assets_handler"
	pictureswebservice "mediaserverapp/mediaserver/webservice"
	"mediaserverapp/mediaserver/webservice/mediaservermiddleware"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi"
	"github.com/jamesrr39/goutil/httpextra"
	"github.com/jamesrr39/goutil/logger"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath                string
	mediaServerDAL          *dal.MediaServerDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.MediaFilesService
	videosWebService        *pictureswebservice.VideoWebService
	collectionsService      *pictureswebservice.CollectionsWebService
	dbConn                  *mediaserverdb.DBConn
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(rootpath, cachesDir, dataDir string, maxConcurrentResizes, maxConcurrentVideoConversions uint) (*MediaServer, error) {
	mediaServerDAL, err := dal.NewMediaServerDAL(rootpath, cachesDir, dataDir, maxConcurrentResizes, maxConcurrentVideoConversions)
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
		picturesMetadataService: pictureswebservice.NewMediaFilesService(dbConn, mediaServerDAL),
		videosWebService:        pictureswebservice.NewVideoWebService(mediaServerDAL.VideosDAL, mediaServerDAL.MediaFilesDAL),
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

	err = mediaServer.mediaServerDAL.PicturesDAL.EnsureAllThumbnailsForPictures(domain.GetPicturesMetadatasFromMediaFileList(mediaFiles))
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

	mediaservermiddleware.ApplyCorsMiddleware(mainRouter)

	mainRouter.Route("/api/", func(r chi.Router) {
		r.Mount("/files/", ms.picturesMetadataService)
		r.Mount("/collections/", ms.collectionsService)
	})

	mainRouter.Mount("/video/", http.StripPrefix("/video/", ms.videosWebService))
	mainRouter.Mount("/picture/", ms.picturesService)
	mainRouter.Mount("/", statichandlers.NewClientHandler())

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()
}
