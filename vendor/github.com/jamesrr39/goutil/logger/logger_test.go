package logger

import (
	"bytes"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func mockNow() time.Time {
	return time.Date(2000, 1, 2, 3, 4, 5, 6, time.UTC)
}
func Test_Debug(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelDebug}
	logger.Debug("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "2000/01/02 03:04:05 DEBUG: ID: 1. Message: \"test error\"\n", writer.String())
}

func Test_Info(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Info("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "2000/01/02 03:04:05 INFO: ID: 1. Message: \"test error\"\n", writer.String())
}

func Test_Warn(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Warn("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "2000/01/02 03:04:05 WARN: ID: 1. Message: \"test error\"\n", writer.String())
}
func Test_Error(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Error("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "2000/01/02 03:04:05 ERROR: ID: 1. Message: \"test error\"\n", writer.String())
}

func Test_LogLevelIgnoreLowLevel(t *testing.T) {
	writer := bytes.NewBuffer(nil)
	logger := Logger{writer, mockNow, LogLevelInfo}
	logger.Debug("ID: %d. Message: %q", 1, "test error")

	assert.Equal(t, "", writer.String())
}
