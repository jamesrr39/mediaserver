package must

import (
	"errors"
	"testing"
	"github.com/stretchr/testify/require"
)

func Test_Must_NoError(t *testing.T) {
	Must(nil)
}

func Test_Must_Error(t *testing.T) {
	defer func() {
		r := recover()
		require.NotNil(t, r)
	}()

	Must(errors.New("test error"))
}

func Test_Mustf_NoError(t *testing.T) {
	Mustf(nil, "")
}


func Test_Mustf_Error(t *testing.T) {
        defer func() {
                r := recover()
		require.NotNil(t, r) // TODO test message
        }()

        Mustf(errors.New("test error"), "deliberate test error: %s", "hello")
}

