package dal

import (
	"mediaserver/mediaserver/domain"
	"testing"

	"github.com/alecthomas/assert"
	"github.com/jamesrr39/goutil/gofs/mockfs"
	"github.com/stretchr/testify/require"
)

func Test_getFilePath(t *testing.T) {
	thumbnailsCache, err := NewThumbnailsDAL(
		mockfs.NewMockFs(),
		nil,
		"a/b/c",
		ThumbnailCachePolicyNoSave,
		nil,
	)
	require.NoError(t, err)

	hash := domain.HashValue("0123456789abcdef")
	height := uint(200)
	assert.Equal(t, "a/b/c/01/23456789abcdef_h200", thumbnailsCache.getFilePath(hash, height))
}
