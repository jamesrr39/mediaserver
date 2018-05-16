package diskcache

import (
	"bytes"
	"encoding/gob"
	"fmt"
	"image"
	"io"
	"mediaserverapp/mediaserver/generated"
	"mediaserverapp/mediaserver/pictures"
	"os"
	"path/filepath"
	"sync"
)

type ThumbnailsCache struct {
	BasePath       string
	mu             *sync.Mutex
	pictureResizer *pictures.PictureResizer
}

type serializedThumbnail struct {
	PictureFormat         string
	GzippedThumbnailBytes []byte
}

func NewThumbnailsCache(basePath string, pictureResizer *pictures.PictureResizer) (*ThumbnailsCache, error) {
	err := os.MkdirAll(basePath, 0700)
	if nil != err {
		return nil, err
	}
	return &ThumbnailsCache{basePath, new(sync.Mutex), pictureResizer}, nil
}

// Get fetches the gzipped thumbnail file bytes and the mime type it's saved in
func (c *ThumbnailsCache) Get(hash pictures.HashValue, size pictures.Size) (io.Reader, string, error) {
	file, err := os.Open(c.getFilePath(hash, size.Height))
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

type GetPictureFunc func(pictureMetadata *pictures.PictureMetadata) (image.Image, string, error)

func (c *ThumbnailsCache) EnsureAllThumbnailsForPicture(pictureMetadata *pictures.PictureMetadata, getPictureFunc GetPictureFunc) error {
	var requiredSizes []pictures.Size
	for x, thumbnailHeight := range generated.ThumbnailHeights {
		if pictureMetadata.RawSize.Height < thumbnailHeight {
			continue
		}
		aspectRatio := pictureMetadata.RawSize.AspectRatio()
		resizeSize := pictures.Size{
			Height: thumbnailHeight,
			Width:  uint(float64(thumbnailHeight) * aspectRatio),
		}
		if pictureMetadata.RawSize.Width < resizeSize.Width {
			continue
		}
		filePath := c.getFilePath(pictureMetadata.HashValue, resizeSize.Height)
		_, err := os.Stat(filePath)
		if err == nil {
			// thumbnail already exists
			continue
		}
		if !os.IsNotExist(err) {
			// there was an error and it wasn't that it doesn't exist already
			return err
		}
		println("adding to required sizes:", filePath, thumbnailHeight, x, resizeSize.Height)

		requiredSizes = append(requiredSizes, resizeSize)
	}

	if len(requiredSizes) == 0 {
		// skip getting the picture, if there are no sizes required
		return nil
	}
	println("required sizes for", fmt.Sprintf("%v", requiredSizes), pictureMetadata.RelativeFilePath, pictureMetadata.HashValue)

	picture, _, err := getPictureFunc(pictureMetadata)
	if err != nil {
		return err
	}

	for _, resizeSize := range requiredSizes {
		newPicture := c.pictureResizer.ResizePicture(picture, resizeSize)
		pictureBytes, err := pictures.EncodePicture(newPicture, pictureMetadata.Format)
		if err != nil {
			return err
		}
		println("resizing to", resizeSize.Width, resizeSize.Height, pictureMetadata.RelativeFilePath, pictureMetadata.HashValue)

		err = c.Save(pictureMetadata.HashValue, resizeSize, pictureMetadata.Format, pictureBytes)
		if err != nil {
			println("errored on", err.Error())
			return err
		}
	}
	return nil
}

// Save persists a gzipped thumbnail bytes to disk
func (c *ThumbnailsCache) Save(hash pictures.HashValue, size pictures.Size, pictureFormat string, gzippedThumbnailBytes []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	filePath := c.getFilePath(hash, size.Height)

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

	err = file.Sync()
	if err != nil {
		return err
	}

	return nil
}

func (c *ThumbnailsCache) IsSizeCacheable(size pictures.Size) bool {
	for _, thumbnailHeight := range generated.ThumbnailHeights {
		if size.Height == thumbnailHeight {
			return true
		}
	}
	return false
}

func (c *ThumbnailsCache) getFilePath(hash pictures.HashValue, height uint) string {
	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, fmt.Sprintf("%s_h%d", rest, height))
}
