package pictureswebservice

import (
	"mediaserverapp/mediaserver/pictures"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_widthAndHeightStringsToSize(t *testing.T) {
	s1, err := widthAndHeightStringsToSize("300", "400", pictures.Size{600, 850})
	assert.Nil(t, err)
	assert.Equal(t, 282, int(s1.Width))
	assert.Equal(t, 400, int(s1.Height))

	s2, err := widthAndHeightStringsToSize("300", "400", pictures.Size{100, 100})
	assert.Nil(t, err)
	assert.Equal(t, 100, int(s2.Width))
	assert.Equal(t, 100, int(s2.Height))

	s3, err := widthAndHeightStringsToSize("300", "400", pictures.Size{600, 750})
	assert.Nil(t, err)
	assert.Equal(t, 300, int(s3.Width))
	assert.Equal(t, 375, int(s3.Height))

	_, err = widthAndHeightStringsToSize("300h", "400", pictures.Size{100, 100})
	assert.NotNil(t, err)

	_, err = widthAndHeightStringsToSize("300", "400a", pictures.Size{100, 100})
	assert.NotNil(t, err)
}
