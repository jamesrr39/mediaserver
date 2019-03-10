package domain

type Location struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type LocationSuggestion struct {
	Location
	Reason string `json:"reason"`
}
