package domain

import (
	"fmt"
	"io"
	"math"
	"time"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/tkrajina/gpxgo/gpx"
	"github.com/tormoder/fit"
)

// FitFileSummary is a summary of a fit file
type FitFileSummary struct {
	MediaFileInfo
	StartTime          time.Time       `json:"startTime"`
	EndTime            time.Time       `json:"endTime"`
	DeviceManufacturer string          `json:"deviceManufacturer"`
	DeviceProduct      string          `json:"deviceProduct"`
	TotalDistance      float64         `json:"totalDistance"`
	ActivityBounds     *ActivityBounds `json:"activityBounds"`
	// NearbyObjects      []*GeographicMapElement `json:"nearbyObjects"`
}

func (s *FitFileSummary) GetMediaFileInfo() MediaFileInfo {
	return s.MediaFileInfo
}

func (s *FitFileSummary) Clone() MediaFile {
	clone := new(FitFileSummary)
	gobClone(s, &clone)
	return clone
}

// NewFitFileSummary creates a new FitFileSummary
func NewFitFileSummary(mediaFileInfo MediaFileInfo, startTime, endTime time.Time, deviceManufacturer, deviceProduct string, totalDistance float64, activityBounds *ActivityBounds) *FitFileSummary {
	return &FitFileSummary{mediaFileInfo, startTime, endTime, deviceManufacturer, deviceProduct, totalDistance, activityBounds}
}

func NewFitFileSummaryFromReader(mediaFileInfo MediaFileInfo, reader io.Reader) (*FitFileSummary, error) {
	file, err := fit.Decode(reader)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	summary, err := newSummaryFromDecodedFitFile(mediaFileInfo, file)
	if nil != err {
		return nil, fmt.Errorf("failed to create a summary for %s. Error: %s", mediaFileInfo.RelativePath, err)
	}

	return summary, nil
}

func NewGPXFileSummaryFromReader(mediaFileInfo MediaFileInfo, reader io.Reader) (*FitFileSummary, error) {
	g, err := gpx.Parse(reader)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	if len(g.Tracks) != 1 {
		return nil, errorsx.Errorf("expected 1 track in file but there were %d", len(g.Tracks))
	}

	track := g.Tracks[0]
	timeBounds := track.TimeBounds()
	movingData := track.MovingData()
	gpxBounds := track.Bounds()

	activityBounds := &ActivityBounds{
		LatMax:  gpxBounds.MaxLatitude,
		LatMin:  gpxBounds.MinLatitude,
		LongMax: gpxBounds.MaxLongitude,
		LongMin: gpxBounds.MinLongitude,
	}

	summary := &FitFileSummary{
		MediaFileInfo:  mediaFileInfo,
		StartTime:      timeBounds.StartTime,
		EndTime:        timeBounds.EndTime,
		TotalDistance:  movingData.MovingDistance,
		DeviceProduct:  g.Creator,
		ActivityBounds: activityBounds,
	}

	return summary, nil
}

func newSummaryFromDecodedFitFile(mediaFileInfo MediaFileInfo, file *fit.File) (*FitFileSummary, error) {
	activity, err := file.Activity()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	if len(activity.Records) < 1 {
		return nil, errorsx.Wrap(err)
	}

	var distanceScaled float64
	for recordIndex := len(activity.Records) - 1; recordIndex >= 0; recordIndex-- {
		record := activity.Records[recordIndex]
		if math.IsNaN(record.GetDistanceScaled()) {
			continue
		}

		distanceScaled = record.GetDistanceScaled()
		break
	}

	activityBounds := ActivityBoundsFromFitActivity(activity)

	return NewFitFileSummary(
			mediaFileInfo,
			activity.Records[0].Timestamp,
			activity.Records[len(activity.Records)-1].Timestamp,
			file.FileId.Manufacturer.String(),
			file.FileId.ProductName,
			distanceScaled,
			activityBounds,
		),
		nil

}
