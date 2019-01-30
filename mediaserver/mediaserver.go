package mediaserver

import (
	"database/sql"
	"fmt"
	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/static_assets_handler"
	pictureswebservice "mediaserverapp/mediaserver/webservice"
	"mediaserverapp/mediaserver/webservice/mediaservermiddleware"
	"net/http"
	"path/filepath"

	"github.com/go-chi/chi"
	"github.com/jamesrr39/goutil/httpextra"
	"github.com/jamesrr39/goutil/logger"
	"github.com/jamesrr39/goutil/profile"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath                string
	mediaServerDAL          *dal.MediaServerDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.MediaFilesService
	videosWebService        *pictureswebservice.VideoWebService
	collectionsService      *pictureswebservice.CollectionsWebService
	tracksService           *pictureswebservice.TracksWebService
	dbConn                  *mediaserverdb.DBConn
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(logger logger.Logger, rootpath, cachesDir, dataDir string, maxConcurrentResizes, maxConcurrentVideoConversions uint, profiler *profile.Profiler) (*MediaServer, error) {
	var err error

	profileRun := profiler.NewRun("NewMediaServerAndScan")
	defer func() {
		message := "Successful"
		if err != nil {
			message = fmt.Sprintf("failed. Error: %q", err)
		}
		profileRun.Record(message)
	}()

	var mediaServerDAL *dal.MediaServerDAL
	profileRun.Measure("new MediaServerDAL", func() {
		mediaServerDAL, err = dal.NewMediaServerDAL(logger, rootpath, cachesDir, dataDir, maxConcurrentResizes, maxConcurrentVideoConversions)
	})
	if nil != err {
		return nil, err
	}

	var dbConn *mediaserverdb.DBConn
	profileRun.Measure("new DB Conn", func() {
		dbConn, err = mediaserverdb.NewDBConn(filepath.Join(dataDir, "mediaserver.db"), logger)
	})
	if nil != err {
		return nil, err
	}

	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		mediaServerDAL:          mediaServerDAL,
		picturesService:         pictureswebservice.NewPicturesService(mediaServerDAL),
		picturesMetadataService: pictureswebservice.NewMediaFilesService(dbConn, mediaServerDAL, profiler),
		videosWebService:        pictureswebservice.NewVideoWebService(mediaServerDAL.VideosDAL, mediaServerDAL.MediaFilesDAL),
		collectionsService:      pictureswebservice.NewCollectionsWebService(dbConn, mediaServerDAL.CollectionsDAL),
		tracksService:           pictureswebservice.NewTracksWebService(mediaServerDAL.TracksDAL, mediaServerDAL.MediaFilesDAL),
	}

	var tx *sql.Tx
	profileRun.Measure("begin tx", func() {
		tx, err = dbConn.Begin()
	})
	if nil != err {
		return nil, err
	}
	defer mediaserverdb.CommitOrRollback(tx)

	profileRun.Measure("update pictures cache", func() {
		err = mediaServer.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx, profileRun)
	})
	if nil != err {
		return nil, err
	}

	var mediaFiles []domain.MediaFile
	profileRun.Measure("get all media files", func() {
		mediaFiles = mediaServer.mediaServerDAL.MediaFilesDAL.GetAll()
	})

	profileRun.Measure("ensure thumbnails for all mediafiles", func() {
		for _, mediaFile := range mediaFiles {
			if mediaFile.GetMediaFileInfo().MediaFileType != domain.MediaFileTypePicture {
				continue
			}
			pictureMetadata := mediaFile.(*domain.PictureMetadata)
			err = mediaServer.mediaServerDAL.ThumbnailsDAL.EnsureAllThumbnailsForPicture(
				pictureMetadata,
				mediaServer.mediaServerDAL.PicturesDAL.GetPicture,
			)
			if err != nil {
				break
			}
		}
	})
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
		r.Mount("/tracks/", ms.tracksService)
	})

	mainRouter.Mount("/video/", http.StripPrefix("/video/", ms.videosWebService))
	mainRouter.Mount("/picture/", ms.picturesService)
	mainRouter.Mount("/", statichandlers.NewClientHandler())

	server := httpextra.NewServerWithTimeouts()
	server.Addr = addr
	server.Handler = mainRouter
	return server.ListenAndServe()
}
