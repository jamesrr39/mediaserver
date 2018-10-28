package domain

type NearbyObjectsFetcher interface {
	Fetch(activity *ActivityBounds) ([]*GeographicMapElement, error)
}
