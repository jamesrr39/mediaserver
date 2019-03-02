package dal

import (
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/testutil"
	"os"
	"testing"

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

	thumbnailsDAL, err := NewThumbnailsDAL(fs, "", nil)
	require.Nil(t, err)

	picturesMetadataRepository := NewPicturesDAL("", thumbnailsDAL, openFileFunc)

	tx, err := dbConn.Begin()
	require.Nil(t, err)

	pictureMetadata := domain.NewPictureMetadata(
		"abcdef123456", "/a/b/c.jpg",
		12345,
		nil,
		domain.RawSize{Width: 400, Height: 400}, "jpeg")

	err = picturesMetadataRepository.CreatePictureMetadata(tx, pictureMetadata)
	require.Nil(t, err)

	fetchedPictureMetadata, err := picturesMetadataRepository.GetPictureMetadata(tx, pictureMetadata.HashValue, pictureMetadata.RelativePath)
	require.Nil(t, err)

	assert.Equal(t, pictureMetadata, fetchedPictureMetadata)
}
