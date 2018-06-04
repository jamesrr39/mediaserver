package collections

import (
	"errors"
	"mediaserverapp/mediaserver/pictures"
)

type Collection struct {
	ID         int64
	Name       string
	FileHashes []pictures.HashValue
}

var ErrNoName = errors.New("no name supplied for the collection")

func (c *Collection) IsValid() error {
	if c.Name == "" {
		return ErrNoName
	}

	return nil
}
