package mediaserverjobs

import (
	"fmt"
	"math"
	"mediaserver/mediaserver/domain"
	"time"

	"github.com/jamesrr39/goutil/errorsx"
)

type fetchTrackRecordsFuncType func(trackSummary *domain.FitFileSummary) (domain.Records, errorsx.Error)

type setLocationsOnPictureFuncType func(pictureMetadata *domain.PictureMetadata, suggestedLocation domain.LocationSuggestion) errorsx.Error

type ApproximateLocationsJob struct {
	allPictureMetadatas   []*domain.PictureMetadata
	trackSummaries        []*domain.FitFileSummary
	fetchTrackRecords     fetchTrackRecordsFuncType
	setLocationsOnPicture setLocationsOnPictureFuncType
}

func NewApproximateLocationsJob(
	allPictureMetadatas []*domain.PictureMetadata,
	trackSummaries []*domain.FitFileSummary,
	fetchTrackRecordsFunc fetchTrackRecordsFuncType,
	setLocationsOnPictureFunc setLocationsOnPictureFuncType,
) *ApproximateLocationsJob {
	return &ApproximateLocationsJob{
		allPictureMetadatas,
		trackSummaries,
		fetchTrackRecordsFunc,
		setLocationsOnPictureFunc,
	}
}

func (j *ApproximateLocationsJob) run() errorsx.Error {
	for _, pictureMetadata := range j.allPictureMetadatas {
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

	// if it's in a track, add that
	for _, trackSummary := range j.trackSummaries {
		if trackSummary.StartTime.Before(*pictureDate) && trackSummary.EndTime.After(*pictureDate) {
			// found a match
			records, err := j.fetchTrackRecords(trackSummary)
			if err != nil {
				return errorsx.Wrap(err)
			}

			record, _, err := records.GetRecordClosestToTime(*pictureDate)
			if err != nil {
				return errorsx.Wrap(err)
			}

			return j.setLocationsOnPicture(pictureMetadata, domain.LocationSuggestion{
				Location: domain.Location{
					Lat: record.PositionLat,
					Lon: record.PositionLong,
				},
				Reason: fmt.Sprintf("suggested by track %s", trackSummary.HashValue),
			})
		}
	}

	// if it's near another photo with a location, suggest that
	for _, pictureMetadataInList := range j.allPictureMetadatas {
		if pictureMetadataInList.ExifData == nil {
			continue
		}

		location, err := pictureMetadataInList.ExifData.GetLocation()
		if err != nil {
			if errorsx.Cause(err) == domain.ErrNotExist {
				// no location for this picture = try next picture
				continue
			}
			return errorsx.Wrap(err)
		}

		pictureInListDate, err := pictureMetadataInList.ExifData.GetDate()
		if err != nil {
			if errorsx.Cause(err) == domain.ErrNotExist {
				// no date for this picture = try next picture
				continue
			}
			return errorsx.Wrap(err)
		}

		pictureTimeTakenBeforeListPicture := pictureDate.Sub(*pictureInListDate)

		if math.Abs(float64(pictureTimeTakenBeforeListPicture)) < float64(7*time.Minute) {
			isTakenBeforeText := "before"
			if pictureTimeTakenBeforeListPicture < 0 {
				isTakenBeforeText = "after"
			}

			return j.setLocationsOnPicture(pictureMetadata, domain.LocationSuggestion{
				Location: *location,
				Reason:   fmt.Sprintf("taken %s %s picture %s", pictureTimeTakenBeforeListPicture.String(), isTakenBeforeText, pictureMetadataInList.HashValue),
			})
		}
	}
	return nil
}

func (j *ApproximateLocationsJob) String() string {
	return fmt.Sprintf("approximate locations job (qty tracks: %d, qty pictures: %d)", len(j.trackSummaries), len(j.allPictureMetadatas))
}

func (j *ApproximateLocationsJob) JobType() JobType {
	return JobTypeCPUJob
}
