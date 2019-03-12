package collections

import (
	"mediaserver/mediaserver/domain"
)

type Collection struct {
	ID         int64              `json:"id"`
	Name       string             `json:"name"`
	FileHashes []domain.HashValue `json:"fileHashes"`
}

type ValidationResult struct {
	Valid   bool
	Message string
}

func (c *Collection) IsValid() ValidationResult {
	if c.Name == "" {
		return ValidationResult{
			Valid:   false,
			Message: "no name supplied for the collection",
		}
	}

	return ValidationResult{Valid: true}
}
