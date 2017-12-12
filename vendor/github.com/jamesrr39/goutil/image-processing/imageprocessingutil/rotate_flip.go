package imageprocessingutil

import (
	"bytes"
	"image"
	_ "image/gif"  // decode
	_ "image/jpeg" // decode
	_ "image/png"  // decode
	"io"

	"github.com/disintegration/imaging"
	"github.com/rwcarlsen/goexif/exif"
)

// RotateAndTransformPicture reads a file and uses the exif information contained within it to figure out what orientation and inversion it should be shown at as a human-usable image
// if it doesn't find any orientatoin data, it will just return the original image
func RotateAndTransformPicture(file io.Reader) (image.Image, error) {

	var byteBuffer bytes.Buffer
	_, err := io.Copy(&byteBuffer, file)
	if nil != err {
		return nil, err
	}

	fileBytes := byteBuffer.Bytes()

	picture, _, err := image.Decode(bytes.NewBuffer(fileBytes))
	if nil != err {
		return nil, err
	}

	exifData, err := exif.Decode(bytes.NewBuffer(fileBytes))
	if nil == err && nil != exifData {
		pic, err := RotateAndTransformPictureByExifData(picture, *exifData)
		if nil == err {
			picture = pic
		}
	}

	return picture, nil

}

// RotateAndTransformPictureByExifData takes an image and exifData and returns the transformed image or an error if there was no data to transform with
func RotateAndTransformPictureByExifData(picture image.Image, exifData exif.Exif) (image.Image, error) {

	tag, err := exifData.Get(exif.Orientation)
	if nil != err {
		return nil, err
	}

	exifOrientation, err := tag.Int(0)
	if nil != err {
		return nil, err
	}
	if exifOrientation == 0 {
		return picture, nil
	}

	return FlipAndRotatePictureByExif(picture, exifOrientation), nil
}

func FlipAndRotatePictureByExif(picture image.Image, exifOrientation int) image.Image {

	// flip
	switch exifOrientation {
	case 1, 3, 8: // do nothing
	case 2, 4:
		picture = imaging.FlipH(picture)
	case 5, 7:
		picture = imaging.FlipV(picture)
	}

	// rotate
	switch exifOrientation {
	case 1, 2: // do nothing
	case 5, 6:
		picture = imaging.Rotate270(picture)
	case 3, 4:
		picture = imaging.Rotate180(picture)
	case 7, 8:
		picture = imaging.Rotate90(picture)
	}

	return picture

}
