package thumbnailscache

import (
	"io"
	"io/ioutil"
	"mediaserverapp/mediaserver/pictures"
	"os"
	"path/filepath"
	"sync"
)

type ThumbnailsCache struct {
	BasePath string
	mu       *sync.Mutex
}

func NewThumbnailsCacheConn(basePath string) (*ThumbnailsCache, error) {
	err := os.MkdirAll(basePath, 0700)
	if nil != err {
		return nil, err
	}
	return &ThumbnailsCache{basePath, new(sync.Mutex)}, nil
}

// Get fetches the gzipped thumbnail file bytes
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

// Save persists a gzipped thumbnail bytes to disk
func (c *ThumbnailsCache) Save(hash pictures.HashValue, gzippedThumbnailBytes []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	return ioutil.WriteFile(c.getFilePath(hash), gzippedThumbnailBytes, 0600)
}

func (c *ThumbnailsCache) getFilePath(hash pictures.HashValue) string {
	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, rest)
}
