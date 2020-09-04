package domain

import (
	"fmt"
	"io"
	"math"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/tormoder/fit"
)

func GetTrackRecordsFromReader(mediaFileInfo MediaFileInfo, reader io.Reader) ([]*Record, error) {
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
			round(distanceScaled),
			round(activityRecord.GetAltitudeScaled()),
			&activityRecord.HeartRate,
		)
		records = append(records, record)
	}

	return records, nil
}

// TODO: replace in Go 1.10
func round(n float64) int {
	if n > 0 {
		return int(math.Floor(n + 0.5))
	}
	return int(math.Floor(n - 0.5))
}

func GetLapsFromRecords(records []*Record, incrementMetres int) []*Lap {
	nextIncrement := incrementMetres
	var laps []*Lap

	amountOfRecords := len(records)
	if amountOfRecords == 0 {
		return laps
	}

	thisLap := &Lap{StartTimestamp: records[0].Timestamp, StartAltitude: records[0].Altitude}
	lastLap := &Lap{}

	lastIndex := amountOfRecords - 1
	for index, record := range records {
		if record.Distance < nextIncrement && (index != lastIndex) {
			// nothing special about this record
			continue
		}

		distanceInLap := record.Distance - lastLap.CumulativeDistanceMetres

		thisLap.EndTimestamp = record.Timestamp
		thisLap.CumulativeDistanceMetres = record.Distance
		thisLap.DistanceInLapMetres = distanceInLap
		thisLap.EndAltitude = record.Altitude

		laps = append(laps, thisLap)

		lastLap = thisLap
		thisLap = &Lap{StartTimestamp: record.Timestamp, StartAltitude: record.Altitude}

		nextIncrement += incrementMetres
	}

	return laps
}
