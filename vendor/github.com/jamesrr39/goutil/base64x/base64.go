package base64x

import (
	"bytes"
	"encoding/base64"
	"io"

	"github.com/jamesrr39/goutil/errorsx"
)

func EncodeBase64(in io.Reader) (string, errorsx.Error) {
	bb := bytes.NewBuffer(nil)
	encoder := base64.NewEncoder(base64.StdEncoding, bb)
	_, err := io.Copy(encoder, in)
	if err != nil {
		return "", errorsx.Wrap(err)
	}
	//flush
	err = encoder.Close()
	if err != nil {
		return "", errorsx.Wrap(err)
	}

	return bb.String(), nil
}

func DecodeBase64(in io.Reader) ([]byte, errorsx.Error) {
	bb := bytes.NewBuffer(nil)
	decoder := base64.NewDecoder(base64.StdEncoding, in)
	_, err := io.Copy(bb, decoder)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return bb.Bytes(), nil

}
