package mediaserverjobs

import (
	"fmt"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type ThumbnailResizerJob struct {
	pictureMetadata *domain.PictureMetadata
	picturesDAL     *dal.PicturesDAL
	logger          *logpkg.Logger
	thumbnailsDAL   *dal.ThumbnailsDAL
}

func NewThumbnailResizerJob(
	pictureMetadata *domain.PictureMetadata,
	picturesDAL *dal.PicturesDAL,
	logger *logpkg.Logger,
	thumbnailsDAL *dal.ThumbnailsDAL,
) *ThumbnailResizerJob {
	return &ThumbnailResizerJob{pictureMetadata, picturesDAL, logger, thumbnailsDAL}
}

func (j *ThumbnailResizerJob) run() errorsx.Error {
	if j.thumbnailsDAL.ThumbnailCachePolicy != dal.ThumbnailCachePolicyAheadOfTime {
		j.logger.Info("skipping ensure thumbnails for picture (due to thumbnail cache policy)")
		return nil
	}

	requiredSizes, err := j.thumbnailsDAL.GetNewSizesRequiredForPicture(j.pictureMetadata)
	if err != nil {
		return errorsx.Wrap(err)
	}

	j.logger.Info("require %d new thumbnails for picture %s (%q), sizes: %v",
		len(requiredSizes),
		j.pictureMetadata.HashValue,
		j.pictureMetadata.RelativePath,
		requiredSizes,
	)

	if len(requiredSizes) == 0 {
		// skip getting the picture, if there are no sizes required
		return nil
	}

	for _, resizeSize := range requiredSizes {
		err = j.resizeAndSave(resizeSize)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}
	return nil
}

func (j *ThumbnailResizerJob) resizeAndSave(requestedSize domain.Size) errorsx.Error {
	picture, _, err := j.picturesDAL.GetPicture(j.pictureMetadata)
	if err != nil {
		return errorsx.Wrap(err)
	}
	newPicture := domain.ResizePicture(picture, requestedSize)
	pictureBytes, err := domain.EncodePicture(newPicture, j.pictureMetadata.Format)
	if err != nil {
		return errorsx.Wrap(err)
	}

	err = j.thumbnailsDAL.Save(j.pictureMetadata.HashValue, requestedSize, j.pictureMetadata.Format, pictureBytes)
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}

func (j *ThumbnailResizerJob) String() string {
	return fmt.Sprintf(
		"thumbnails for %s (%q)",
		j.pictureMetadata.HashValue,
		j.pictureMetadata.RelativePath,
	)
}

func (j *ThumbnailResizerJob) Name() string {
	return "thumbnail_resize_job"
}

func (j *ThumbnailResizerJob) JobType() JobType {
	return JobTypeCPUJob
}
