package pictures

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
)

func EncodePicture(picture image.Image, format string) ([]byte, error) {
	byteBuffer := bytes.NewBuffer(nil)

	switch format {
	case "jpeg":
		jpeg.Encode(byteBuffer, picture, nil)
	case "png":
		png.Encode(byteBuffer, picture)
	case "gif":
		gif.Encode(byteBuffer, picture, nil)
	default:
		return nil, fmt.Errorf("mime type not supported: '%s'", format)
	}

	return byteBuffer.Bytes(), nil
}
