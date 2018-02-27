package thumbnailscache

import (
	"io"
	"io/ioutil"
	"mediaserverapp/mediaserver/pictures"
	"os"
	"path/filepath"
)

type ThumbnailsCache struct {
	BasePath string
}

func NewThumbnailsCacheConn(basePath string) *ThumbnailsCache {
	return &ThumbnailsCache{basePath}
}

func (c *ThumbnailsCache) Get(hash pictures.HashValue) (io.ReadCloser, error) {
	file, err := os.Open(c.getFilePath(hash))
	if nil == err {
		return file, nil
	}

	if os.IsNotExist(err) {
		return nil, nil
	}

	return nil, err
}

func (c *ThumbnailsCache) Save(hash pictures.HashValue, gzippedThumbnailBytes []byte) error {
	return ioutil.WriteFile(c.getFilePath(hash), gzippedThumbnailBytes, 0600)
}

func (c *ThumbnailsCache) getFilePath(hash pictures.HashValue) string {
	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, rest)
}
