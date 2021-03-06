package dal

import (
	"bytes"
	"encoding/gob"
	"fmt"
	"io"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/generated"
	"os"
	"path/filepath"
	"sync"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
)

type ThumbnailCachePolicy int

const (
	// generate thumbnails only when requested
	ThumbnailCachePolicyOnDemand ThumbnailCachePolicy = iota
	// generate all thumbnails as soon as possible
	ThumbnailCachePolicyAheadOfTime
	// don't write thumbnails to disk
	ThumbnailCachePolicyNoSave
)

var thumbnailCachePolicyNames = []string{
	"on-demand",
	"ahead-of-time",
	"no-save",
}

func (t ThumbnailCachePolicy) String() string {
	return thumbnailCachePolicyNames[t]
}

type ThumbnailsDAL struct {
	fs                   gofs.Fs
	logger               *logpkg.Logger
	BasePath             string
	mu                   *sync.Mutex
	ThumbnailCachePolicy ThumbnailCachePolicy
	profiler             *profile.Profiler
}

type serializedThumbnail struct {
	PictureFormat         string
	GzippedThumbnailBytes []byte
}

func NewThumbnailsDAL(
	fs gofs.Fs,
	logger *logpkg.Logger,
	basePath string,
	thumbnailCachePolicy ThumbnailCachePolicy,
	profiler *profile.Profiler) (*ThumbnailsDAL, error) {
	err := fs.MkdirAll(basePath, 0700)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}
	return &ThumbnailsDAL{fs, logger, basePath, new(sync.Mutex), thumbnailCachePolicy, profiler}, nil
}

// Get fetches the gzipped thumbnail file bytes and the mime type it's saved in
func (c *ThumbnailsDAL) Get(hash domain.HashValue, size domain.Size) (io.Reader, string, error) {
	file, err := c.fs.Open(c.getFilePath(hash, size.Height))
	if nil != err {
		if os.IsNotExist(err) {
			return nil, "", nil
		}

		return nil, "", errorsx.Wrap(err)
	}
	defer file.Close()

	var thumbnail serializedThumbnail
	err = gob.NewDecoder(file).Decode(&thumbnail)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	return bytes.NewBuffer(thumbnail.GzippedThumbnailBytes), thumbnail.PictureFormat, nil
}

func (c *ThumbnailsDAL) GetNewSizesRequiredForPicture(pictureMetadata *domain.PictureMetadata) ([]domain.Size, error) {
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
			return nil, errorsx.Wrap(err)
		}

		requiredSizes = append(requiredSizes, resizeSize)
	}
	return requiredSizes, nil
}

func (c *ThumbnailsDAL) Save(hash domain.HashValue, size domain.Size, pictureFormat string, gzippedThumbnailBytes []byte) error {
	if c.ThumbnailCachePolicy == ThumbnailCachePolicyNoSave {
		c.logger.Info("skipping save thumbnail for picture (due to thumbnail cache policy)")
		return nil
	}

	filePath := c.getFilePath(hash, size.Height)

	err := c.fs.MkdirAll(filepath.Dir(filePath), 0700)
	if nil != err {
		return errorsx.Wrap(err)
	}

	file, err := c.fs.Create(filePath)
	if nil != err {
		return errorsx.Wrap(err)
	}
	defer file.Close()

	thumbnail := &serializedThumbnail{pictureFormat, gzippedThumbnailBytes}
	err = gob.NewEncoder(file).Encode(thumbnail)
	if nil != err {
		return errorsx.Wrap(err)
	}

	err = file.Sync()
	if err != nil {
		return errorsx.Wrap(err)
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
	c.mu.Lock()
	defer c.mu.Unlock()

	firstPart := string(hash)[0:2]
	rest := string(hash)[2:]
	return filepath.Join(c.BasePath, firstPart, fmt.Sprintf("%s_h%d", rest, height))
}
