package mediaserver

import (
	"database/sql"
	"fmt"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/mediaserverjobs"
	"mediaserver/mediaserver/static_assets_handler"
	pictureswebservice "mediaserver/mediaserver/webservice"
	"mediaserver/mediaserver/webservice/mediaservermiddleware"
	"net/http"
	"path/filepath"
	"time"

	"github.com/go-chi/chi"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
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
	graphQLService          *pictureswebservice.GraphQLAPIService
	backupService           *pictureswebservice.BackupWebService
	dbConn                  *mediaserverdb.DBConn
	jobRunner               *mediaserverjobs.JobRunner
	logger                  *logpkg.Logger
}

// NewMediaServerAndScan creates a new MediaServer and builds a cache of pictures by scanning the rootpath
func NewMediaServerAndScan(logger *logpkg.Logger, fs gofs.Fs, rootpath, cachesDir, dataDir string, maxConcurrentCPUJobs, maxConcurrentVideoConversions uint, profiler *profile.Profiler, thumbnailCachePolicy dal.ThumbnailCachePolicy, maxConcurrentTrackRecordsParsing, maxConcurrentResizes uint) (*MediaServer, error) {
	var err error
	profileRun := profiler.NewRun("NewMediaServerAndScan")
	defer func() {
		message := "Successful"
		if err != nil {
			message = fmt.Sprintf("failed. Error: %q", err)
		}
		profileRun.StopAndRecord(message)
	}()

	var mediaServerDAL *dal.MediaServerDAL
	mediaServerDAL, err = dal.NewMediaServerDAL(logger, fs, rootpath, cachesDir, dataDir, maxConcurrentCPUJobs, maxConcurrentVideoConversions, thumbnailCachePolicy, maxConcurrentTrackRecordsParsing, maxConcurrentResizes)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	var dbConn *mediaserverdb.DBConn
	profileRun.Measure("new DB Conn")
	dbConn, err = mediaserverdb.NewDBConn(filepath.Join(dataDir, "mediaserver.db"), logger)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	graphQLAPIService, err := pictureswebservice.NewGraphQLAPIService(logger, dbConn, mediaServerDAL.TracksDAL, mediaServerDAL.MediaFilesDAL, mediaServerDAL.PeopleDAL)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	mediaServer := &MediaServer{
		Rootpath:                rootpath,
		mediaServerDAL:          mediaServerDAL,
		picturesService:         pictureswebservice.NewPicturesService(logger, mediaServerDAL),
		picturesMetadataService: pictureswebservice.NewMediaFilesService(logger, dbConn, mediaServerDAL, profiler),
		videosWebService:        pictureswebservice.NewVideoWebService(mediaServerDAL.VideosDAL, mediaServerDAL.MediaFilesDAL),
		collectionsService:      pictureswebservice.NewCollectionsWebService(logger, dbConn, mediaServerDAL.CollectionsDAL, profiler),
		tracksService:           pictureswebservice.NewTracksWebService(logger, mediaServerDAL.TracksDAL, mediaServerDAL.MediaFilesDAL),
		graphQLService:          graphQLAPIService,
		backupService: pictureswebservice.NewBackupService(
			logger, profiler, dbConn, mediaServerDAL.CollectionsDAL, mediaServerDAL.PeopleDAL, mediaServerDAL.MediaFilesDAL,
		),
		logger: logger,
	}

	startupMeasurement := profileRun.Measure("startup")

	var tx *sql.Tx
	startupMeasurement.MeasureStep("begin tx")
	tx, err = dbConn.Begin()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	defer mediaserverdb.CommitOrRollback(tx)

	startupMeasurement.MeasureStep("update pictures cache")
	err = mediaServer.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx, profileRun)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	mediaServer.mediaServerDAL.MediaFilesDAL.QueueSuggestedLocationJob()

	startupMeasurement.MeasureStep("get all media files")
	mediaFiles := mediaServer.mediaServerDAL.MediaFilesDAL.GetAll()

	startupMeasurement.MeasureStep("ensure thumbnails for all mediafiles")
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
	if err != nil {
		return nil, errorsx.Wrap(err)
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
	mainRouter.Use(mediaservermiddleware.CreateRequestLoggerMiddleware(ms.logger))

	mainRouter.Route("/api/", func(r chi.Router) {
		r.Mount("/files/", ms.picturesMetadataService)
		r.Mount("/collections/", ms.collectionsService)
		r.Mount("/tracks/", ms.tracksService)
		r.Mount("/graphql", ms.graphQLService)
		r.Mount("/backup", ms.backupService)
	})

	mainRouter.Mount("/video/", http.StripPrefix("/video/", ms.videosWebService))
	mainRouter.Mount("/picture/", ms.picturesService)
	mainRouter.Mount("/", statichandlers.NewClientHandler())

	server := http.Server{
		ReadHeaderTimeout: time.Minute,
		ReadTimeout:       time.Minute * 20,
		WriteTimeout:      time.Minute * 20,
		IdleTimeout:       time.Minute * 5,
		Addr:              addr,
		Handler:           mainRouter,
	}
	return server.ListenAndServe()
}
