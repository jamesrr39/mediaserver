package diskcache

import (
	"bytes"
	"encoding/gob"
	"io"
	"mediaserverapp/mediaserver/pictures"
	"os"
	"path/filepath"
	"sync"
)

type ThumbnailsCache struct {
	BasePath string
	mu       *sync.Mutex
}

type serializedThumbnail struct {
	PictureFormat         string
	GzippedThumbnailBytes []byte
}

func NewThumbnailsCacheConn(basePath string) (*ThumbnailsCache, error) {
	err := os.MkdirAll(basePath, 0700)
	if nil != err {
		return nil, err
	}
	return &ThumbnailsCache{basePath, new(sync.Mutex)}, nil
}

// Get fetches the gzipped thumbnail file bytes and the mime type it's saved in
func (c *ThumbnailsCache) Get(hash pictures.HashValue) (io.Reader, string, error) {
	file, err := os.Open(c.getFilePath(hash))
	if nil != err {
		if os.IsNotExist(err) {
			return nil, "", nil
		}

		return nil, "", err
	}
	defer file.Close()

	var thumbnail serializedThumbnail
	err = gob.NewDecoder(file).Decode(&thumbnail)
	if nil != err {
		return nil, "", err
	}

	return bytes.NewBuffer(thumbnail.GzippedThumbnailBytes), thumbnail.PictureFormat, nil
}

// Save persists a gzipped thumbnail bytes to disk
func (c *ThumbnailsCache) Save(hash pictures.HashValue, pictureFormat string, gzippedThumbnailBytes []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	filePath := c.getFilePath(hash)

	err := os.MkdirAll(filepath.Dir(filePath), 0700)
	if nil != err {
		return err
	}

	file, err := os.Create(filePath)
	if nil != err {
		return err
	}
	defer file.Close()

	thumbnail := &serializedThumbnail{pictureFormat, gzippedThumbnailBytes}
	err = gob.NewEncoder(file).Encode(thumbnail)
	if nil != err {
		return err
	}

	return nil
}

func (c *ThumbnailsCache) IsSizeCacheable(width, height string) bool {
	if height == "200" {
		return true
	}
	return false
}

func (c *ThumbnailsCache) getFilePath(hash pictures.HashValue) string {
	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, rest)
}
