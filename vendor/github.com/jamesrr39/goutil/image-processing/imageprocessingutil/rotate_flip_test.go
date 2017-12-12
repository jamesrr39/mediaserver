package imageprocessingutil

import (
	"bytes"
	"image"
	"image/jpeg"

	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_RotateAndTransformPicture_noexif(t *testing.T) {
	pic := image.NewRGBA(image.Rect(0, 0, 20, 30))

	byteBuffer := bytes.NewBuffer(nil)
	err := jpeg.Encode(byteBuffer, pic, nil)
	assert.Nil(t, err)

	picture, err := RotateAndTransformPicture(byteBuffer)
	assert.Nil(t, err)

	assert.NotNil(t, picture)
}
