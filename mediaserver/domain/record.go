package domain

import "time"

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
