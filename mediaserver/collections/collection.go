package collections

import (
	"errors"
	"mediaserverapp/mediaserver/domain"
)

type Collection struct {
	ID         int64              `json:"id"`
	Name       string             `json:"name"`
	FileHashes []domain.HashValue `json:"fileHashes"`
}

var ErrNoName = errors.New("no name supplied for the collection")

func (c *Collection) IsValid() error {
	if c.Name == "" {
		return ErrNoName
	}

	return nil
}
