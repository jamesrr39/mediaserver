package videodal

import (
	"mediaserverapp/mediaserver/pictures"
	"os"
)

type VideoDAL interface {
	GetFile(hash pictures.HashValue) (*os.File, error)
	AddFile(mediaFile pictures.MediaFile) error
}
