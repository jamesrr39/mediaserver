package mediaserverjobs

import (
	"fmt"
	"math"
	"mediaserverapp/mediaserver/domain"
	"time"

	"github.com/jamesrr39/goutil/errorsx"
)

type fetchTrackRecordsFuncType func(trackSummary *domain.FitFileSummary) (domain.Records, errorsx.Error)

type fetchAllPictureMetadatasFuncType func() ([]*domain.PictureMetadata, errorsx.Error)

type setLocationsOnPictureFuncType func(pictureMetadata *domain.PictureMetadata, suggestedLocation domain.LocationSuggestion) errorsx.Error

type ApproximateLocationsJob struct {
	fetchAllPictureMetadatas fetchAllPictureMetadatasFuncType
	trackSummaries           []*domain.FitFileSummary
	fetchTrackRecords        fetchTrackRecordsFuncType
	setLocationsOnPicture    setLocationsOnPictureFuncType
}

func NewApproximateLocationsJob(
	fetchAllPictureMetadatasFunc fetchAllPictureMetadatasFuncType,
	trackSummaries []*domain.FitFileSummary,
	fetchTrackRecordsFunc fetchTrackRecordsFuncType,
	setLocationsOnPictureFunc setLocationsOnPictureFuncType,
) *ApproximateLocationsJob {
	return &ApproximateLocationsJob{
		fetchAllPictureMetadatasFunc,
		trackSummaries,
		fetchTrackRecordsFunc,
		setLocationsOnPictureFunc,
	}
}

func (j *ApproximateLocationsJob) run() error {
	picturesMetadatas, err := j.fetchAllPictureMetadatas()
	if err != nil {
		return errorsx.Wrap(err)
	}

	for _, pictureMetadata := range picturesMetadatas {
		// if it has a location already, skip
		if pictureMetadata.ExifData != nil {
			existingLocation, err := pictureMetadata.ExifData.GetLocation()
			if err != nil {
				return fmt.Errorf("error while processing %q (%q): %s", pictureMetadata.HashValue, pictureMetadata.RelativePath, err)
			}

			if existingLocation != nil {
				continue
			}
		}

		pictureDate, err := pictureMetadata.ExifData.GetDate()
		if err != nil {
			return errorsx.Wrap(err)
		}

		if pictureDate == nil {
			continue
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
		for _, pictureMetadataInList := range picturesMetadatas {
			if pictureMetadataInList.ExifData == nil {
				continue
			}

			location, err := pictureMetadataInList.ExifData.GetLocation()
			if err != nil {
				return errorsx.Wrap(err)
			}

			if location == nil {
				continue
			}

			pictureInListDate, err := pictureMetadataInList.ExifData.GetDate()
			if err != nil {
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
	}
	return nil
}

func (j *ApproximateLocationsJob) String() string {
	return "approximate locations job"
}

func (j *ApproximateLocationsJob) JobType() JobType {
	return JobTypeCPUJob
}
