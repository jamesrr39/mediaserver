package collections

import "mediaserverapp/mediaserver/pictures"

type Collection struct {
	ID         int64
	Name       string
	FileHashes []pictures.HashValue
}
