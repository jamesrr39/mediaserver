package domain

type Location struct {
	Lat float64
	Lon float64
}

type LocationSuggestion struct {
	Location
	Reason string
}
