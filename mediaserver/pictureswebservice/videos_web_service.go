package pictureswebservice

import (
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/videodal"
	"net/http"
)

type fileWebFileServer struct{ videosDAL videodal.VideoDAL }

func (fwfs *fileWebFileServer) Open(hashValue string) (http.File, error) {
	return fwfs.videosDAL.GetFile(pictures.HashValue(hashValue))
}

type VideoWebService struct {
	http.Handler
}

func NewVideoWebService(videosDAL videodal.VideoDAL) *VideoWebService {
	fwfs := &fileWebFileServer{videosDAL}

	fileWebService := &VideoWebService{http.FileServer(fwfs)}

	return fileWebService
}
