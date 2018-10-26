package diskstorage

import (
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/testutil"
	"testing"

	"github.com/alecthomas/assert"
	"github.com/stretchr/testify/require"
)

func Test_CrudPictureMetadataNoExif(t *testing.T) {
	dbConn := testutil.NewTestDB(t)
	defer dbConn.Close()

	picturesMetadataRepository := NewPicturesMetadataRepository()

	tx, err := dbConn.Begin()
	require.Nil(t, err)

	pictureMetadata := domain.NewPictureMetadata(
		"abcdef123456", "/a/b/c.jpg",
		12345,
		nil,
		domain.RawSize{Width: 400, Height: 400}, "jpeg")

	err = picturesMetadataRepository.CreatePictureMetadata(tx, pictureMetadata)
	require.Nil(t, err)

	fetchedPictureMetadata, err := picturesMetadataRepository.GetPictureMetadata(tx, pictureMetadata.HashValue, pictureMetadata.RelativeFilePath)
	require.Nil(t, err)

	assert.Equal(t, pictureMetadata, fetchedPictureMetadata)
}
