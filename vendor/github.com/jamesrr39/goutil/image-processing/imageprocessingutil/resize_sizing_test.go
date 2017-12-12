package imageprocessingutil

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_GetResizeSize(t *testing.T) {
	size := GetResizeSize(Size{Width: 100, Height: 50}, Size{Width: 150, Height: 133})
	assert.Equal(t, 100, size.Width)
	assert.Equal(t, 50, size.Height)

	size2 := GetResizeSize(Size{Width: 100, Height: 50}, Size{Width: 90, Height: 133})
	assert.Equal(t, 90, size2.Width)
	assert.Equal(t, 45, size2.Height)

	size3 := GetResizeSize(Size{Width: 100, Height: 50}, Size{Width: 190, Height: 33})
	assert.Equal(t, 66, size3.Width)
	assert.Equal(t, 33, size3.Height)

	size4 := GetResizeSize(Size{Width: 100, Height: 50}, Size{Width: 12, Height: 33})
	assert.Equal(t, 12, size4.Width)
	assert.Equal(t, 6, size4.Height)
}
