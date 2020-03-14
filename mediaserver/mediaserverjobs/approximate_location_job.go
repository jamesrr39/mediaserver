package mediaserverjobs

import (
	"fmt"
	"math"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/domain"
	"time"

	"github.com/jamesrr39/goutil/errorsx"
)

// ApproximateLocationsJob is a job to suggest where a mediafile can be located geographically
// TODO: output 2 or more suggested locations, if suitable
type ApproximateLocationsJob struct {
	mediaFilesDAL    *dal.MediaFilesDAL
	tracksDAL        *dal.TracksDAL
	mediaFilesForJob []*domain.PictureMetadata
}

func NewApproximateLocationsJob(
	mediaFilesDAL *dal.MediaFilesDAL,
	tracksDAL *dal.TracksDAL,
	mediaFilesForJob []*domain.PictureMetadata,
) *ApproximateLocationsJob {
	return &ApproximateLocationsJob{
		mediaFilesDAL,
		tracksDAL,
		mediaFilesForJob,
	}
}

func (j *ApproximateLocationsJob) run() errorsx.Error {
	for _, pictureMetadata := range j.mediaFilesForJob {
		err := j.setLocationOnPicture(pictureMetadata)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}
	return nil
}
func (j *ApproximateLocationsJob) setLocationOnPicture(pictureMetadata *domain.PictureMetadata) errorsx.Error {
	// if it doesn't have any metadata, skip this picture
	if pictureMetadata.ExifData == nil {
		return nil
	}

	// if it has a location already, skip
	existingLocation, err := pictureMetadata.ExifData.GetLocation()
	if err != nil && errorsx.Cause(err) != domain.ErrNotExist {
		return errorsx.Errorf("error while processing %q (%q): %s", pictureMetadata.HashValue, pictureMetadata.RelativePath, err)
	}

	if existingLocation != nil {
		// location already exists
		return nil
	}

	pictureDate, err := pictureMetadata.ExifData.GetDate()
	if err != nil {
		if errorsx.Cause(err) == domain.ErrNotExist {
			// if it has no location or date, skip this picture
			return nil
		}
		return errorsx.Wrap(err)
	}

	// now on to cross-matching with other media files
	for _, mediaFile := range j.mediaFilesDAL.GetAll() {
		switch mediaFile.GetMediaFileInfo().MediaFileType {
		case domain.MediaFileTypePicture:
			matchFound, err := j.tryAndMatchWithPicture(pictureMetadata, *pictureDate, mediaFile.(*domain.PictureMetadata))
			if err != nil {
				return errorsx.Wrap(err)
			}
			if matchFound {
				return nil
			}
		case domain.MediaFileTypeFitTrack:
			matchFound, err := j.tryAndMatchWithTrack(pictureMetadata, *pictureDate, mediaFile.(*domain.FitFileSummary))
			if err != nil {
				return errorsx.Wrap(err)
			}
			if matchFound {
				return nil
			}
		}
	}

	return nil
}

// match found, error
func (j *ApproximateLocationsJob) tryAndMatchWithTrack(pictureMetadata *domain.PictureMetadata, pictureDate time.Time, trackSummary *domain.FitFileSummary) (bool, error) {
	if trackSummary.StartTime.Before(pictureDate) && trackSummary.EndTime.After(pictureDate) {
		// found a match
		records, err := j.tracksDAL.GetRecords(trackSummary)
		if err != nil {
			return false, errorsx.Wrap(err)
		}

		record, _, err := records.GetRecordClosestToTime(pictureDate)
		if err != nil {
			return false, errorsx.Wrap(err)
		}

		pictureMetadata.SuggestedLocation = &domain.LocationSuggestion{
			Location: domain.Location{
				Lat: record.PositionLat,
				Lon: record.PositionLong,
			},
			Reason: fmt.Sprintf("suggested by track %s", trackSummary.HashValue),
		}

		return true, nil
	}

	return false, nil
}

func (j *ApproximateLocationsJob) tryAndMatchWithPicture(
	pictureMetadata *domain.PictureMetadata,
	pictureDate time.Time,
	pictureMetadataInList *domain.PictureMetadata,
) (bool, error) {
	if pictureMetadataInList.ExifData == nil {
		return false, nil
	}

	location, err := pictureMetadataInList.ExifData.GetLocation()
	if err != nil {
		if errorsx.Cause(err) == domain.ErrNotExist {
			// no location for this picture = try next picture
			return false, nil
		}
		return false, errorsx.Wrap(err)
	}

	pictureInListDate, err := pictureMetadataInList.ExifData.GetDate()
	if err != nil {
		if errorsx.Cause(err) == domain.ErrNotExist {
			// no date for this picture = try next picture
			return false, nil
		}
		return false, errorsx.Wrap(err)
	}

	pictureTimeTakenBeforeListPicture := pictureDate.Sub(*pictureInListDate)

	if math.Abs(float64(pictureTimeTakenBeforeListPicture)) < float64(7*time.Minute) {
		isTakenBeforeText := "before"
		if pictureTimeTakenBeforeListPicture < 0 {
			isTakenBeforeText = "after"
		}

		pictureMetadata.SuggestedLocation = &domain.LocationSuggestion{
			Location: *location,
			Reason:   fmt.Sprintf("taken %s %s picture %s", pictureTimeTakenBeforeListPicture.String(), isTakenBeforeText, pictureMetadataInList.HashValue),
		}
		return true, nil
	}

	return false, nil
}

func (j *ApproximateLocationsJob) String() string {
	return "approximate locations job"
}

func (j *ApproximateLocationsJob) JobType() JobType {
	return JobTypeCPUJob
}
