package mediaserverjobs

import (
	"fmt"
	"mediaserverapp/mediaserver/domain"
)

type ThumbnailResizerJob struct {
	pictureMetadata *domain.PictureMetadata
	requestedSize   domain.Size
	getPictureFunc  domain.GetPictureFunc
	save            saveFunc
}

type saveFunc func(hash domain.HashValue, size domain.Size, pictureFormat string, gzippedThumbnailBytes []byte) error

func NewThumbnailResizerJob(
	pictureMetadata *domain.PictureMetadata,
	requestedSize domain.Size,
	getPictureFunc domain.GetPictureFunc,
	save saveFunc,
) *ThumbnailResizerJob {
	return &ThumbnailResizerJob{pictureMetadata, requestedSize, getPictureFunc, save}
}

func (j *ThumbnailResizerJob) run() error {
	picture, _, err := j.getPictureFunc(j.pictureMetadata)
	if err != nil {
		return err
	}
	newPicture := domain.ResizePicture(picture, j.requestedSize)
	pictureBytes, err := domain.EncodePicture(newPicture, j.pictureMetadata.Format)
	if err != nil {
		return err
	}

	err = j.save(j.pictureMetadata.HashValue, j.requestedSize, j.pictureMetadata.Format, pictureBytes)
	if err != nil {
		return err
	}

	return nil
}

func (j *ThumbnailResizerJob) String() string {
	return fmt.Sprintf(
		"thumbnail for %s (%q) to size x: %d, y: %d",
		j.pictureMetadata.HashValue,
		j.pictureMetadata.RelativePath,
		j.requestedSize.Width,
		j.requestedSize.Height,
	)
}

func (j *ThumbnailResizerJob) JobType() JobType {
	return JobTypeCPUJob
}
