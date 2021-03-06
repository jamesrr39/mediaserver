package webservice

import (
	"log"
	picturesdal "mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/videodal"
	"mediaserver/mediaserver/domain"
	"net/http"
	"os"
	"strings"
)

type fileWebFileServer struct {
	videosDAL     videodal.VideoDAL
	mediaFilesDAL *picturesdal.MediaFilesDAL
}

// Open looks up the converted video, then looks up the original video
func (fwfs *fileWebFileServer) Open(hashValue string) (http.File, error) {
	hashValue = strings.TrimPrefix(hashValue, "/")

	convertedVideo, err := fwfs.videosDAL.GetFile(domain.HashValue(hashValue))
	if err != nil && !os.IsNotExist(err) {
		log.Printf("couldn't open file with hash value %q. Error: %q\n", hashValue, err)
	}
	if err == nil {
		return convertedVideo, nil
	}

	mediaFile := fwfs.mediaFilesDAL.Get(domain.HashValue(hashValue))
	if mediaFile == nil {
		return nil, os.ErrNotExist
	}

	return fwfs.mediaFilesDAL.OpenFile(mediaFile)
}

type VideoWebService struct {
	http.Handler
}

func NewVideoWebService(videosDAL videodal.VideoDAL, mediaFilesDAL *picturesdal.MediaFilesDAL) *VideoWebService {
	fwfs := &fileWebFileServer{videosDAL, mediaFilesDAL}

	fileWebService := &VideoWebService{http.FileServer(fwfs)}

	return fileWebService
}
