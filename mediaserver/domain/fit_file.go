package domain

import (
	"fmt"
	"io"
	"math"
	"path/filepath"
	"strconv"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/tkrajina/gpxgo/gpx"
	"github.com/tormoder/fit"
)

func GetTrackRecordsFromReader(mediaFileInfo MediaFileInfo, reader io.Reader) ([]*Record, error) {
	switch filepath.Ext(mediaFileInfo.RelativePath) {
	case ".fit":
		return getTrackRecordsFromFitFileReader(mediaFileInfo, reader)
	case ".gpx":
		return getTrackRecordsFromGpxFileReader(mediaFileInfo, reader)
	default:
		return nil, errorsx.Errorf("unhandled file extension", "relativePath", mediaFileInfo.RelativePath)
	}
}

func getHeartRate(nodes []gpx.ExtensionNode) (*uint8, errorsx.Error) {
	for _, node := range nodes {
		for _, attr := range node.Attrs {
			// TODO "Local": correct?
			if attr.Name.Local == "hr" {
				hrFloat, err := strconv.ParseFloat(attr.Value, 64)
				if err != nil {
					return nil, errorsx.Wrap(err)
				}
				hr := uint8(hrFloat)
				return &hr, nil
			}
		}

		hr, err := getHeartRate(node.Nodes)
		if err != nil {
			return nil, err
		}
		if hr != nil {
			return hr, nil
		}
	}

	return nil, nil
}

func getTrackRecordsFromGpxFileReader(mediaFileInfo MediaFileInfo, reader io.Reader) ([]*Record, error) {
	g, err := gpx.Parse(reader)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	if len(g.Tracks) != 1 {
		return nil, errorsx.Errorf("expected 1 track but there were %d", len(g.Tracks))
	}
	var totalDistance float64
	track := g.Tracks[0]
	records := []*Record{}
	var prevPoint gpx.Point
	for _, segment := range track.Segments {
		for _, point := range segment.Points {
			heartRate, err := getHeartRate(point.Extensions.Nodes)
			if err != nil {
				return nil, errorsx.Wrap(err)
			}

			if len(records) != 0 {
				// TODO: is it worth using useHaversine here?
				const useHaversine = true
				distanceFromLastPoint := gpx.Distance2D(point.Latitude, point.Longitude, prevPoint.Latitude, prevPoint.Longitude, useHaversine)
				totalDistance += distanceFromLastPoint
			}

			record := &Record{
				Timestamp:          point.Timestamp,
				PositionLat:        point.Latitude,
				PositionLong:       point.Longitude,
				CumulativeDistance: totalDistance,
				Altitude:           point.Elevation.Value(),
				HeartRate:          heartRate,
			}

			records = append(records, record)

			prevPoint = point.Point

		}
	}
	println("total distance:", totalDistance, mediaFileInfo.HashValue)
	return records, nil
}

func getTrackRecordsFromFitFileReader(mediaFileInfo MediaFileInfo, reader io.Reader) ([]*Record, error) {
	decodedFile, err := fit.Decode(reader)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	activity, err := decodedFile.Activity()
	if nil != err {
		return nil, fmt.Errorf("failed to get activity for %s. Error: %s", mediaFileInfo.RelativePath, err)
	}

	// parse all records
	var records []*Record
	for _, activityRecord := range activity.Records {
		if activityRecord.PositionLat.Invalid() || activityRecord.PositionLong.Invalid() {
			// skip (we are not interested in records without a position)
			continue
		}

		distanceScaled := activityRecord.GetDistanceScaled()

		if math.IsNaN(distanceScaled) {
			continue
		}

		record := NewRecord(
			activityRecord.Timestamp,
			activityRecord.PositionLat.Degrees(),
			activityRecord.PositionLong.Degrees(),
			math.Round(distanceScaled),
			math.Round(activityRecord.GetAltitudeScaled()),
			&activityRecord.HeartRate,
		)
		records = append(records, record)
	}

	return records, nil
}

func GetLapsFromRecords(records []*Record, incrementMetres float64) []*Lap {
	nextIncrement := incrementMetres
	laps := []*Lap{}

	amountOfRecords := len(records)
	if amountOfRecords == 0 {
		return laps
	}

	thisLap := &Lap{StartTimestamp: records[0].Timestamp, StartAltitude: records[0].Altitude}
	lastLap := &Lap{}

	lastIndex := amountOfRecords - 1
	for index, record := range records {
		if record.CumulativeDistance < nextIncrement && (index != lastIndex) {
			// nothing special about this record
			continue
		}

		distanceInLap := record.CumulativeDistance - lastLap.CumulativeDistanceMetres

		thisLap.EndTimestamp = record.Timestamp
		thisLap.CumulativeDistanceMetres = record.CumulativeDistance
		thisLap.DistanceInLapMetres = distanceInLap
		thisLap.EndAltitude = record.Altitude

		laps = append(laps, thisLap)

		lastLap = thisLap
		thisLap = &Lap{StartTimestamp: record.Timestamp, StartAltitude: record.Altitude}

		nextIncrement += incrementMetres
	}

	return laps
}
