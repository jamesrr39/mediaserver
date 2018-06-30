//+build linux
package dirtraversal

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_IsTryingToTraverseUp(t *testing.T) {
	assert.True(t, IsTryingToTraverseUp("my folder/../ab"))
	assert.True(t, IsTryingToTraverseUp("my folder/.."))
	assert.True(t, IsTryingToTraverseUp("/../ab"))
	assert.True(t, IsTryingToTraverseUp("../ab"))
	assert.True(t, IsTryingToTraverseUp("../"))
	assert.True(t, IsTryingToTraverseUp(".."))

	assert.False(t, IsTryingToTraverseUp("my folder/..a/ab"))
	assert.False(t, IsTryingToTraverseUp("my folder/.a/.ab"))
	assert.False(t, IsTryingToTraverseUp("my folder/a/ab"))
	assert.False(t, IsTryingToTraverseUp("."))
	assert.False(t, IsTryingToTraverseUp(""))
}
