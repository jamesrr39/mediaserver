package streamtostorage

import (
	"encoding/binary"
	"io"
)

// StreamToStorageWriter is a writer for writing streams of messages to a writer.
// Writes are not synchronized, the caller must provide the synchronization if it will be written to from multiple goroutines.
type Writer struct {
	file io.Writer
}

func NewWriter(file io.Writer) *Writer {
	return &Writer{file}
}

func (s *Writer) Write(message []byte) (int, error) {
	lenBuffer := make([]byte, 8)
	binary.LittleEndian.PutUint64(lenBuffer, uint64(len(message)))

	return s.file.Write(append(lenBuffer, message...))
}

type Reader struct {
	file io.Reader
}

func NewReader(file io.Reader) *Reader {
	return &Reader{file}
}

// ReadNextMessage reads the next message from the reader (starting from the beginning)
// Once the end of the reader has been reached, an io.EOF error is returned.
func (sr *Reader) ReadNextMessage() ([]byte, error) {
	lenBuffer := make([]byte, 8)
	_, err := sr.file.Read(lenBuffer)
	if err != nil {
		return nil, err
	}

	messageLen := binary.LittleEndian.Uint64(lenBuffer)
	messageBuffer := make([]byte, messageLen)

	_, err = sr.file.Read(messageBuffer)
	if err != nil {
		return nil, err
	}

	return messageBuffer, nil
}
