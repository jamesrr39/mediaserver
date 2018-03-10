package diskcache

import (
	"mediaserverapp/mediaserver/pictures"
	"testing"

	"github.com/alecthomas/assert"
)

func Test_getFilePath(t *testing.T) {
	thumbnailsCache := &ThumbnailsCache{
		BasePath: "a/b/c",
	}

	hash := pictures.HashValue("0123456789abcdef")
	assert.Equal(t, "a/b/c/01/23456789abcdef", thumbnailsCache.getFilePath(hash))
}
