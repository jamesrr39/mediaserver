package pictureswebservice

import (
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type fileWebFileServer struct{ mediaServerDAL *picturesdal.MediaServerDAL }

func (fwfs *fileWebFileServer) Open(hashValue string) (http.File, error) {
	mediaFile := fwfs.mediaServerDAL.MediaFilesDAL.Get(pictures.HashValue(strings.TrimPrefix(hashValue, "/")))
	if mediaFile == nil {
		return nil, os.ErrNotExist
	}

	return os.Open(filepath.Join(fwfs.mediaServerDAL.Rootpath, mediaFile.GetRelativePath()))
}

type FileWebService struct {
	mediaServerDAL *picturesdal.MediaServerDAL
	http.Handler
}

func NewFileWebService(mediaServerDAL *picturesdal.MediaServerDAL) *FileWebService {
	fwfs := &fileWebFileServer{mediaServerDAL}

	fileWebService := &FileWebService{mediaServerDAL, http.FileServer(fwfs)}

	return fileWebService
}
