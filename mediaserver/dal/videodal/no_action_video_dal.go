package videodal

import (
	"mediaserverapp/mediaserver/domain"
	"os"
)

type NoActionVideoDAL struct {
}

func NewNoActionVideoDAL() *NoActionVideoDAL {
	return &NoActionVideoDAL{}
}

func (dal *NoActionVideoDAL) GetFile(hash domain.HashValue) (*os.File, error) {
	return nil, os.ErrNotExist
}

func (dal *NoActionVideoDAL) EnsureSupportedFile(mediaFile domain.MediaFile) error {
	return nil
}
