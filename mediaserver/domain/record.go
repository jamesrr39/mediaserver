package domain

import (
	"errors"
	"time"
)

type Record struct {
	Timestamp    time.Time `json:"timestamp"`
	PositionLat  float64   `json:"posLat"`
	PositionLong float64   `json:"posLong"`
	Distance     int       `json:"distance"`
	Altitude     int       `json:"altitude"`
}

func NewRecord(timestamp time.Time, posLat, posLong float64, distance, altitude int) *Record {
	return &Record{Timestamp: timestamp, PositionLat: posLat, PositionLong: posLong, Distance: distance, Altitude: altitude}
}

type Records []*Record

func (r Records) GetRecordClosestToTime(dateTime time.Time) (*Record, int, error) {
	if len(r) == 0 {
		return nil, 0, errors.New("expected at least one record, but there were none")
	}

	upperIndex := len(r) - 1
	lowerIndex := 0

	for i := 0; i < (len(r) + 5); i++ {
		if upperIndex-lowerIndex == 1 {
			if r[upperIndex].Timestamp.Sub(dateTime) < dateTime.Sub(r[lowerIndex].Timestamp) {
				return r[upperIndex], upperIndex, nil
			}
			return r[lowerIndex], lowerIndex, nil
		}

		currentIndex := ((upperIndex - lowerIndex) / 2) + lowerIndex
		record := r[currentIndex]

		if r[currentIndex].Timestamp.Equal(dateTime) {
			return record, currentIndex, nil
		}

		if r[currentIndex].Timestamp.Sub(dateTime) > 0 {
			upperIndex = currentIndex
		} else {
			lowerIndex = currentIndex
		}
	}

	return nil, 0, errors.New("reached max limit of iteration for binary search (implementation error)")
}
