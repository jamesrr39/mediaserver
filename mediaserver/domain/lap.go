package domain

import "time"

type Lap struct {
	StartTimestamp           time.Time `json:"startTimestamp"`
	EndTimestamp             time.Time `json:"endTimestamp"`
	DistanceInLapMetres      float64   `json:"distanceInLapMetres"`
	CumulativeDistanceMetres float64   `json:"cumulativeDistanceMetres"`
	StartAltitude            float64   `json:"startAltitude"`
	EndAltitude              float64   `json:"endAltitude"`
}
