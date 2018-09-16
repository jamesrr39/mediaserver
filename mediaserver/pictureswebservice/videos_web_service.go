package pictureswebservice

import (
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"mediaserverapp/mediaserver/picturesdal/videodal"
	"net/http"
	"os"
)

type fileWebFileServer struct {
	videosDAL     videodal.VideoDAL
	mediaFilesDAL *picturesdal.MediaFilesDAL
}

// Open looks up the converted video, then looks up the original video
func (fwfs *fileWebFileServer) Open(hashValue string) (http.File, error) {
	convertedVideo, err := fwfs.videosDAL.GetFile(pictures.HashValue(hashValue))
	if err != nil && !os.IsNotExist(err) {
		log.Printf("couldn't open file with hash value %q. Error: %q\n", hashValue, err)
	}
	if err == nil {
		return convertedVideo, nil
	}

	mediaFile := fwfs.mediaFilesDAL.Get(pictures.HashValue(hashValue))
	if mediaFile == nil {
		return nil, os.ErrNotExist
	}

	return os.Open(fwfs.mediaFilesDAL.GetFullPath(mediaFile))
}

type VideoWebService struct {
	http.Handler
}

func NewVideoWebService(videosDAL videodal.VideoDAL, mediaFilesDAL *picturesdal.MediaFilesDAL) *VideoWebService {
	fwfs := &fileWebFileServer{videosDAL, mediaFilesDAL}

	fileWebService := &VideoWebService{http.FileServer(fwfs)}

	return fileWebService
}
