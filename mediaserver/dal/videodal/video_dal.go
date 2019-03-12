package videodal

import (
	"mediaserver/mediaserver/domain"
	"os"
)

type VideoDAL interface {
	GetFile(hash domain.HashValue) (*os.File, error)
	EnsureSupportedFile(mediaFile domain.MediaFile) error
}
