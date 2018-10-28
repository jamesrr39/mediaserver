package domain

import "time"

type Lap struct {
	StartTimestamp           time.Time `json:"startTimestamp"`
	EndTimestamp             time.Time `json:"endTimestamp"`
	DistanceInLapMetres      int       `json:"distanceInLapMetres"`
	CumulativeDistanceMetres int       `json:"cumulativeDistanceMetres"`
	StartAltitude            int       `json:"startAltitude"`
	EndAltitude              int       `json:"endAltitude"`
}
