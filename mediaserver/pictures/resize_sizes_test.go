package pictures

import (
	"testing"

	"github.com/alecthomas/assert"
)

func Test_widthAndHeightStringsToSize(t *testing.T) {
	s1, err := WidthAndHeightStringsToSize("300", "400", Size{Width: 600, Height: 850})
	assert.Nil(t, err)
	assert.Equal(t, 282, int(s1.Width))
	assert.Equal(t, 400, int(s1.Height))

	s2, err := WidthAndHeightStringsToSize("300", "400", Size{Width: 100, Height: 100})
	assert.Nil(t, err)
	assert.Equal(t, 100, int(s2.Width))
	assert.Equal(t, 100, int(s2.Height))

	s3, err := WidthAndHeightStringsToSize("300", "400", Size{Width: 600, Height: 750})
	assert.Nil(t, err)
	assert.Equal(t, 300, int(s3.Width))
	assert.Equal(t, 375, int(s3.Height))

	_, err = WidthAndHeightStringsToSize("300h", "400", Size{Width: 100, Height: 100})
	assert.NotNil(t, err)

	_, err = WidthAndHeightStringsToSize("300", "400a", Size{Width: 100, Height: 100})
	assert.NotNil(t, err)
}
