package userextra

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExpandUser(t *testing.T) {

	dir, err := ExpandUser("~/Documents")

	assert.Nil(t, err)
	assert.Equal(t, "/", string(dir[0]))
	assert.True(t, strings.HasSuffix(dir, "/Documents"))

}
