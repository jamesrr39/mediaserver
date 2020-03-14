package dal

import (
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/testutil"
	"os"
	"testing"
	"time"

	"github.com/alecthomas/assert"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/gofs/mockfs"
	"github.com/stretchr/testify/require"
)

func Test_CrudPictureMetadataNoExif(t *testing.T) {
	dbConn := testutil.NewTestDB(t)
	defer dbConn.Close()

	fs := mockfs.NewMockFs()
	openFileFunc := func(mediaFile domain.MediaFile) (gofs.File, error) {
		return nil, os.ErrNotExist
	}

	thumbnailsDAL, err := NewThumbnailsDAL(fs, nil, "", ThumbnailCachePolicyNoSave, nil)
	require.Nil(t, err)

	picturesMetadataRepository := NewPicturesDAL("", thumbnailsDAL, openFileFunc, 4)

	tx, err := dbConn.Begin()
	require.Nil(t, err)

	fileInfo := domain.NewMediaFileInfo(
		"abcdef123456",
		"/a/b/c.jpg",
		12345,
		0,
		[]int64{},
		time.Unix(0, 0),
		0700,
	)

	pictureMetadata := domain.NewPictureMetadata(
		fileInfo,
		nil,
		domain.RawSize{Width: 400, Height: 400},
		"jpeg",
	)

	err = picturesMetadataRepository.CreatePictureMetadata(tx, pictureMetadata)
	require.Nil(t, err)

	fetchedPictureMetadata, err := picturesMetadataRepository.GetPictureMetadata(tx, fileInfo)
	require.Nil(t, err)

	assert.Equal(t, pictureMetadata, fetchedPictureMetadata)
}
