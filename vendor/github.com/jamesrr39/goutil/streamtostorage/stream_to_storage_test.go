package streamtostorage

import (
	"bytes"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	message1        = "hello 1"
	message2        = "hello message 2 with different length"
	uint64SizeBytes = 8
)

func Test_WriteRead(t *testing.T) {
	bb := bytes.NewBuffer(nil)
	writer := NewWriter(bb)
	i, err := writer.Write([]byte(message1))
	require.Nil(t, err)
	require.Equal(t, len(message1)+uint64SizeBytes, i)

	i, err = writer.Write([]byte(message2))
	require.Nil(t, err)
	require.Equal(t, len(message2)+uint64SizeBytes, i)

	reader := NewReader(bb)
	message, err := reader.ReadNextMessage()
	require.Nil(t, err)
	assert.Equal(t, []byte(message1), message)

	message, err = reader.ReadNextMessage()
	require.Nil(t, err)
	assert.Equal(t, []byte(message2), message)

	_, err = reader.ReadNextMessage()
	assert.Equal(t, io.EOF, err)
}
