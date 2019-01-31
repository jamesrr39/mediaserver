package dal

import (
	"bytes"
	"encoding/gob"
	"fmt"
	"io"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/generated"
	"mediaserverapp/mediaserver/mediaserverjobs"
	"os"
	"path/filepath"
	"sync"

	"github.com/jamesrr39/goutil/gofs"
)

type ThumbnailsDAL struct {
	fs        gofs.Fs
	BasePath  string
	mu        *sync.Mutex
	jobRunner *mediaserverjobs.JobRunner
}

type serializedThumbnail struct {
	PictureFormat         string
	GzippedThumbnailBytes []byte
}

func NewThumbnailsDAL(fs gofs.Fs, basePath string, jobRunner *mediaserverjobs.JobRunner) (*ThumbnailsDAL, error) {
	err := fs.MkdirAll(basePath, 0700)
	if nil != err {
		return nil, err
	}
	return &ThumbnailsDAL{fs, basePath, new(sync.Mutex), jobRunner}, nil
}

// Get fetches the gzipped thumbnail file bytes and the mime type it's saved in
func (c *ThumbnailsDAL) Get(hash domain.HashValue, size domain.Size) (io.Reader, string, error) {
	file, err := c.fs.Open(c.getFilePath(hash, size.Height))
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

func (c *ThumbnailsDAL) getNewSizesRequiredForPicture(pictureMetadata *domain.PictureMetadata) ([]domain.Size, error) {
	var requiredSizes []domain.Size
	for _, thumbnailHeight := range generated.ThumbnailHeights {
		if pictureMetadata.RawSize.Height < thumbnailHeight {
			continue
		}
		aspectRatio := pictureMetadata.RawSize.AspectRatio()
		resizeSize := domain.Size{
			Height: thumbnailHeight,
			Width:  uint(float64(thumbnailHeight) * aspectRatio),
		}
		if pictureMetadata.RawSize.Width < resizeSize.Width {
			continue
		}
		filePath := c.getFilePath(pictureMetadata.HashValue, resizeSize.Height)
		_, err := c.fs.Stat(filePath)
		if err == nil {
			// thumbnail already exists
			continue
		}
		if !os.IsNotExist(err) {
			// there was an error and it wasn't that it doesn't exist already
			return nil, err
		}

		requiredSizes = append(requiredSizes, resizeSize)
	}
	return requiredSizes, nil
}

func (c *ThumbnailsDAL) EnsureAllThumbnailsForPicture(pictureMetadata *domain.PictureMetadata, getPictureFunc domain.GetPictureFunc) error {
	requiredSizes, err := c.getNewSizesRequiredForPicture(pictureMetadata)
	if err != nil {
		return err
	}

	if len(requiredSizes) == 0 {
		// skip getting the picture, if there are no sizes required
		return nil
	}

	for _, resizeSize := range requiredSizes {
		resizeJob := mediaserverjobs.NewThumbnailResizerJob(pictureMetadata, resizeSize, getPictureFunc, c.save)
		c.jobRunner.QueueJob(resizeJob)
	}
	return nil
}

func (c *ThumbnailsDAL) save(hash domain.HashValue, size domain.Size, pictureFormat string, gzippedThumbnailBytes []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	filePath := c.getFilePath(hash, size.Height)

	err := c.fs.MkdirAll(filepath.Dir(filePath), 0700)
	if nil != err {
		return err
	}

	file, err := c.fs.Create(filePath)
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

func (c *ThumbnailsDAL) IsSizeCacheable(size domain.Size) bool {
	for _, thumbnailHeight := range generated.ThumbnailHeights {
		if size.Height == thumbnailHeight {
			return true
		}
	}
	return false
}

func (c *ThumbnailsDAL) getFilePath(hash domain.HashValue, height uint) string {
	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, fmt.Sprintf("%s_h%d", rest, height))
}
