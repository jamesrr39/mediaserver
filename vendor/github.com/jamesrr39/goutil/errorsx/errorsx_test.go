package errorsx

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_Error_Error(t *testing.T) {
	err := Errorf("test error created by: %q", "test user")
	assert.Equal(t, "test error created by: \"test user\"", err.Error())
	assert.NotEmpty(t, err.Stack)

	err2 := Wrap(err)
	assert.Equal(t, "test error created by: \"test user\"", err2.Error())
	assert.NotEmpty(t, err2.Stack)

	// stacks should be different
	assert.NotEqual(t, err.Stack, err2.Stack)
}

func Test_Error_Cause_new(t *testing.T) {
	err := errors.New("test error")
	err2 := Wrap(err)
	err3 := Wrap(err2)

	assert.Equal(t, err, Cause(err2))
	assert.Equal(t, err, Cause(err3))
}
