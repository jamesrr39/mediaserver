package videodal

import (
	"mediaserverapp/mediaserver/pictures"
	"os"
)

type NoActionVideoDAL struct {
}

func NewNoActionVideoDAL() *NoActionVideoDAL {
	return &NoActionVideoDAL{}
}

func (dal *NoActionVideoDAL) GetFile(hash pictures.HashValue) (*os.File, error) {
	return nil, os.ErrNotExist
}

func (dal *NoActionVideoDAL) EnsureSupportedFile(mediaFile pictures.MediaFile) error {
	return nil
}
