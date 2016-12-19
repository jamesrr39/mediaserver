package mediaserver

import (
	//	"log"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/pictureswebservice"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type MediaServer struct {
	Rootpath                string
	picturesDAL             *picturesdal.PicturesDAL
	picturesService         *pictureswebservice.PicturesService
	picturesMetadataService *pictureswebservice.PicturesMetadataService
}

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
	//router := mux.NewRouter()
	//router.Handle("/picture", ms.picturesService.Router)
	//router.Handle("/api/pictureMetadata", ms.picturesMetadataService.Router)
	//router.PathPrefix("/api/picture").Subrouter()

	err := ms.picturesDAL.UpdatePicturesCache()
	if nil != err {
		return err
	}

	mainRouter := mux.NewRouter()

	mainRouter.PathPrefix("/api/pictureMetadata/").Handler(http.StripPrefix("/api/pictureMetadata", ms.picturesMetadataService.Router))
	mainRouter.PathPrefix("/picture/").Handler(http.StripPrefix("/picture", ms.picturesService.Router))
	mainRouter.PathPrefix("/static/").Handler(http.FileServer(http.Dir("static")))
	return http.ListenAndServe(":"+strconv.Itoa(port), mainRouter)

	/*

	   mainRouter := mux.NewRouter()
	   subRouter := mainRouter.PathPrefix("/").Subrouter()

	   subRouter.HandleFunc("/test1", func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, "test1") })
	   subRouter.HandleFunc("/test2", func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, "test2") })

	   mainRouter.Handle("/", mainRouter)

	*/

	/*
		router := mux.NewRouter()
		router.Handle("/api/pictureMetadata/", ms.picturesMetadataService.Router)
		//router.Handle("/", http.FileServer(http.Dir("webapp")))

		log.Printf("router: %v\n", router)

		s := &http.Server{Addr: ":" + strconv.Itoa(port), Handler: router}
		return s.ListenAndServe()
	*/
}
