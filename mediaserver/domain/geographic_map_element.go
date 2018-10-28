package domain

type GeographicMapElement struct {
	Tags struct {
		Name  string `json:"name"`
		Place string `json:"place"`
		IsIn  string `json:"isIn"`
	} `json:"tags"`
}
