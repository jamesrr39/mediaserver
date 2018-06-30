package logger

import (
	"bytes"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func mockNow() time.Time {
	return time.Date(2000, 1, 1, 1, 1, 1, 1, time.UTC)
}
func Test_Debug(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelDebug}
	logger.Debug("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "DEBUG: ID: 1. Message: \"test error\" | 2000/01/01 01:01:01\n", writer.String())
}

func Test_Info(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Info("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "INFO: ID: 1. Message: \"test error\" | 2000/01/01 01:01:01\n", writer.String())
}

func Test_Warn(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Warn("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "WARN: ID: 1. Message: \"test error\" | 2000/01/01 01:01:01\n", writer.String())
}
func Test_Error(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Error("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "ERROR: ID: 1. Message: \"test error\" | 2000/01/01 01:01:01\n", writer.String())
}

func Test_LogLevelIgnoreLowLevel(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Debug("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "", writer.String())
}
