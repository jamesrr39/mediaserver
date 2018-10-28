package domain

import (
	"math"

	"github.com/tormoder/fit"
)

type ActivityBounds struct {
	LatMin  float64 `json:"latMin"`  // between -90 (south pole) and +90 (north pole)
	LatMax  float64 `json:"latMax"`  // between -90 (south pole) and +90 (north pole)
	LongMin float64 `json:"longMin"` // between -180 and +180
	LongMax float64 `json:"longMax"` // between -180 and +180
}

func ActivityBoundsFromFitActivity(activity *fit.ActivityFile) *ActivityBounds {
	activityBounds := &ActivityBounds{90, -90, 180, -180}

	for _, activityRecord := range activity.Records {
		// todo handle activityRecord.PositionLat.Invalid ?
		if activityRecord.PositionLat.Invalid() || activityRecord.PositionLong.Invalid() {
			// skip (we are not interested in records without a position)
			continue
		}

		distanceScaled := activityRecord.GetDistanceScaled()

		if math.IsNaN(distanceScaled) {
			continue
		}

		posLat := activityRecord.PositionLat.Degrees()
		if posLat < activityBounds.LatMin {
			activityBounds.LatMin = posLat
		}

		if posLat > activityBounds.LatMax {
			activityBounds.LatMax = posLat
		}

		posLong := activityRecord.PositionLong.Degrees()
		if posLong < activityBounds.LongMin {
			activityBounds.LongMin = posLong
		}

		if posLong > activityBounds.LongMax {
			activityBounds.LongMax = posLong
		}
	}
	return activityBounds
}
