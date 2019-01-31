package domain

import (
	"fmt"
	"io"

	"github.com/rwcarlsen/goexif/exif"
	"github.com/rwcarlsen/goexif/tiff"
)

type ExifData map[string]interface{}

func DecodeExifFromFile(file io.Reader) (*ExifData, error) {
	externalExifData, err := exif.Decode(file)
	if err != nil {
		return nil, err
	}

	exifData := make(ExifData)
	err = externalExifData.Walk(&exifData)
	if err != nil {
		return nil, err
	}

	return &exifData, nil
}

func (e ExifData) Walk(name exif.FieldName, tag *tiff.Tag) error {
	e[string(name)] = tag
	return nil
}

func (e ExifData) GetOrientation() (int, error) {
	orientationInf := e["Orientation"]
	switch orientationInf.(type) {
	case int:
		return (orientationInf).(int), nil
	case *tiff.Tag:
		orientationTag := orientationInf.(*tiff.Tag)
		orientationInt, err := orientationTag.Int(0)
		if err != nil {
			return 0, err
		}
		return orientationInt, nil
	default:
		return 0, fmt.Errorf("couldn't convert orientation (%T):(%v) to int", orientationInf, orientationInf)
	}
}
