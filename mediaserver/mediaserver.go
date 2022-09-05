package mediaserver

import (
	"compress/gzip"
	"database/sql"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/events"
	"mediaserver/mediaserver/mediaserverjobs"
	"mediaserver/mediaserver/statichandlers"
	"mediaserver/mediaserver/webservice"
	pictureswebservice "mediaserver/mediaserver/webservice"
	"mediaserver/mediaserver/webservice/mediaservermiddleware"
	"net/http"
	"path/filepath"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
)

// MediaServer is a server used for showing pieces of media
type MediaServer struct {
	Rootpath           string
	mediaServerDAL     *dal.MediaServerDAL
	picturesService    *pictureswebservice.PicturesService
	filesService       *pictureswebservice.MediaFilesService
	videosWebService   *pictureswebservice.VideoWebService
	collectionsService *pictureswebservice.CollectionsWebService
	tracksService      *pictureswebservice.TracksWebService
	graphQLService     *pictureswebservice.GraphQLAPIService
	eventsService      *pictureswebservice.EventsWebService
	loginService       *pictureswebservice.LoginService
	dbConn             *mediaserverdb.DBConn
	jobRunner          *mediaserverjobs.JobRunner
	logger             *logpkg.Logger
	closeChan          chan struct{}
	hmacSigningSecret  []byte
}

// NewMediaServer creates a new MediaServer
func NewMediaServer(logger *logpkg.Logger, fs gofs.Fs, rootpath, cachesDir, dataDir string, maxConcurrentCPUJobs, maxConcurrentVideoConversions uint, profiler *profile.Profiler, thumbnailCachePolicy dal.ThumbnailCachePolicy, maxConcurrentTrackRecordsParsing, maxConcurrentResizes uint, hmacSigningSecret []byte) (*MediaServer, error) {

	eventBus := events.NewEventBus()

	jobRunner := mediaserverjobs.NewJobRunner(logger, maxConcurrentCPUJobs, eventBus)

	var mediaServerDAL *dal.MediaServerDAL
	mediaServerDAL, err := dal.NewMediaServerDAL(
		logger,
		fs,
		profiler,
		rootpath,
		cachesDir,
		dataDir,
		maxConcurrentCPUJobs,
		maxConcurrentVideoConversions,
		thumbnailCachePolicy,
		maxConcurrentTrackRecordsParsing,
		maxConcurrentResizes,
	)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dbConn, err := mediaserverdb.NewDBConn(filepath.Join(dataDir, "mediaserver.db"), logger)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	graphQLAPIService, err := pictureswebservice.NewGraphQLAPIService(logger, dbConn, mediaServerDAL.TracksDAL, mediaServerDAL.MediaFilesDAL, mediaServerDAL.PeopleDAL)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	eventsServiceSubscriber, err := events.NewSubscriber("events_websocket_subscriber", "(.*?)")
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	eventBus.Subscribe(eventsServiceSubscriber)

	mediaServer := &MediaServer{
		Rootpath:           rootpath,
		mediaServerDAL:     mediaServerDAL,
		picturesService:    pictureswebservice.NewPicturesService(logger, mediaServerDAL),
		filesService:       pictureswebservice.NewMediaFilesService(logger, dbConn, mediaServerDAL, profiler, jobRunner),
		videosWebService:   pictureswebservice.NewVideoWebService(mediaServerDAL.VideosDAL, mediaServerDAL.MediaFilesDAL),
		collectionsService: pictureswebservice.NewCollectionsWebService(logger, dbConn, mediaServerDAL.CollectionsDAL, profiler),
		tracksService:      pictureswebservice.NewTracksWebService(logger, mediaServerDAL.TracksDAL, mediaServerDAL.MediaFilesDAL),
		eventsService:      pictureswebservice.NewEventsWebService(logger, eventsServiceSubscriber.Chan),
		loginService:       pictureswebservice.NewLoginService(logger, dbConn, mediaServerDAL.PeopleDAL, hmacSigningSecret),
		graphQLService:     graphQLAPIService,
		logger:             logger,
		dbConn:             dbConn,
		closeChan:          make(chan struct{}),
		jobRunner:          jobRunner,
		hmacSigningSecret:  hmacSigningSecret,
	}

	return mediaServer, nil
}

func (ms *MediaServer) Close() error {
	return ms.dbConn.Close()
}

// scans for pictures and serves http server
func (ms *MediaServer) ListenAndServe(addr string) errorsx.Error {
	var err error

	readyChan := make(chan bool)

	mainRouter := chi.NewRouter()
	mainRouter.Use(middleware.Logger)
	mainRouter.Use(middleware.Compress(gzip.DefaultCompression))
	mainRouter.Use(mediaservermiddleware.LoadingMiddleware(readyChan))
	mainRouter.Use(mediaservermiddleware.CreateRequestLoggerMiddleware(ms.logger))

	authMW := mediaservermiddleware.NewAuthMiddleware(ms.logger, ms.hmacSigningSecret)

	mainRouter.Route("/api/", func(r chi.Router) {
		r.Get("/appinfo", webservice.BuildGetAppInfo(ms.logger, ms.hmacSigningSecret, ms.dbConn, ms.mediaServerDAL.PeopleDAL))
		r.Mount("/login/", ms.loginService)
		r.Route("/", func(r chi.Router) {
			r.Use(authMW)
			r.Mount("/files/", ms.filesService)
			r.Mount("/collections/", ms.collectionsService)
			r.Mount("/tracks/", ms.tracksService)
			r.Mount("/graphql", ms.graphQLService)
			r.Mount("/events/", ms.eventsService)
		})
	})

	mainRouter.Route("/file/", func(r chi.Router) {
		r.Use(authMW)
		r.Mount("/video/", http.StripPrefix("/video/", ms.videosWebService))
		r.Mount("/picture/", ms.picturesService)
	})
	staticFilesHandler, err := statichandlers.NewClientHandler()
	if err != nil {
		return errorsx.Wrap(err)
	}
	mainRouter.Mount("/", staticFilesHandler)

	server := http.Server{
		ReadHeaderTimeout: time.Minute,
		ReadTimeout:       time.Minute * 20,
		WriteTimeout:      time.Minute * 20,
		IdleTimeout:       time.Minute * 5,
		Addr:              addr,
		Handler:           mainRouter,
	}

	errChan := make(chan errorsx.Error)
	go func() {
		err := server.ListenAndServe()
		if err != nil {
			errChan <- errorsx.Wrap(err)
			return
		}
	}()

	err = ms.scan()
	if err != nil {
		return errorsx.Wrap(err)
	}
	readyChan <- true

	select {
	case err = <-errChan:
		// assign error and do nothing else
	case <-ms.closeChan:
		// do nothing
	}

	return errorsx.Wrap(err)
}

func (ms *MediaServer) scan() errorsx.Error {

	var tx *sql.Tx
	tx, err := ms.dbConn.Begin()
	if nil != err {
		return errorsx.Wrap(err)
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ms.mediaServerDAL.MediaFilesDAL.UpdatePicturesCache(tx)
	if nil != err {
		return errorsx.Wrap(err)
	}

	allPictureMetadatas := ms.mediaServerDAL.MediaFilesDAL.GetAllPictureMetadatas()

	ms.jobRunner.QueueJob(mediaserverjobs.NewApproximateLocationsJob(
		ms.mediaServerDAL.MediaFilesDAL,
		ms.mediaServerDAL.TracksDAL,
		allPictureMetadatas,
	), nil)

	for _, pictureMetadata := range allPictureMetadatas {
		ms.jobRunner.QueueJob(
			mediaserverjobs.NewThumbnailResizerJob(
				pictureMetadata,
				ms.mediaServerDAL.PicturesDAL,
				ms.logger,
				ms.mediaServerDAL.ThumbnailsDAL,
			), nil)
	}

	return nil
}
