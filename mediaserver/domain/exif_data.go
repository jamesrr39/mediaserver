package domain

import (
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

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

func (e ExifData) GetLocation() (*Location, error) {
	gpsLatitude, err := e.propToStringSlice("GPSLatitude")
	if err != nil {
		return nil, err
	}
	gpsLatitudeRef, err := e.propToString("GPSLatitudeRef")
	if err != nil {
		return nil, err
	}
	gpsLongitude, err := e.propToStringSlice("GPSLongitude")
	if err != nil {
		return nil, err
	}
	gpsLongitudeRef, err := e.propToString("GPSLongitudeRef")
	if err != nil {
		return nil, err
	}
	gpsMapDatum, err := e.propToString("GPSMapDatum")
	if err != nil {
		return nil, err
	}
	switch gpsMapDatum {
	case "WGS-84":
		if len(gpsLatitude) == 0 ||
			(gpsLatitudeRef != "N" && gpsLatitudeRef != "S") ||
			len(gpsLongitude) == 0 ||
			(gpsLongitudeRef != "W" && gpsLongitudeRef != "E") {
			return nil, nil
		}
		return parseWGS84ToLocation(gpsLatitude, gpsLatitudeRef, gpsLongitude, gpsLongitudeRef)
	default:
		return nil, fmt.Errorf("unknown GPSMapDatum type: %q", gpsMapDatum)
	}
}

func parseWGS84ToLocation(
	gpsLatitude []string,
	gpsLatitudeRef string,
	gpsLongitude []string,
	gpsLongitudeRef string) (*Location, error) {
	latDegs, err := asDecimal(gpsLatitude[0])
	if err != nil {
		return nil, err
	}
	latMins, err := asDecimal(gpsLatitude[1])
	if err != nil {
		return nil, err
	}
	latSecs, err := asDecimal(gpsLatitude[2])
	if err != nil {
		return nil, err
	}
	lat := ((((latSecs / 60) + latMins) / 60) + latDegs)
	if gpsLatitudeRef == "S" {
		lat = lat * -1
	}
	lonDegs, err := asDecimal(gpsLongitude[0])
	if err != nil {
		return nil, err
	}
	lonMins, err := asDecimal(gpsLongitude[1])
	if err != nil {
		return nil, err
	}
	lonSecs, err := asDecimal(gpsLongitude[2])
	if err != nil {
		return nil, err
	}
	lon := ((((lonSecs / 60) + lonMins) / 60) + lonDegs)

	if gpsLongitudeRef == "W" {
		lon = lon * -1
	}

	return &Location{
		Lat: lat,
		Lon: lon,
	}, nil
}

func asDecimal(value string) (float64, error) {
	fragments := strings.Split(value, "/")
	switch len(fragments) {
	case 1:
		return strconv.ParseFloat(value, 64)
	case 2:
		numerator, err := strconv.ParseFloat(fragments[0], 64)
		if err != nil {
			return 0, err
		}
		denominator, err := strconv.ParseFloat(fragments[1], 64)
		if err != nil {
			return 0, err
		}
		return numerator / denominator, nil
	default:
		return 0, fmt.Errorf("could not understand %q", value)
	}
}

func (e ExifData) propToString(keyName string) (string, error) {
	val := e[keyName]
	switch val.(type) {
	case string:
		return val.(string), nil
	case *tiff.Tag:
		tag := val.(*tiff.Tag)
		return tag.StringVal()
	}

	return "", fmt.Errorf("couldn't convert exif key %q (%T):(%v) to string", keyName, val, val)
}

func (e ExifData) propToStringSlice(keyName string) ([]string, error) {
	val := e[keyName]
	switch val.(type) {
	case []string:
		return val.([]string), nil
	case *tiff.Tag:
		tag := val.(*tiff.Tag)
		return nil, fmt.Errorf("don't know how to handle %v (%T)", tag, tag)
	}

	return nil, fmt.Errorf("couldn't convert exif key %q (%T):(%v) to string slice", keyName, val, val)
}

func (e ExifData) GetDate() (*time.Time, error) {
	for _, key := range []string{"DateTime", "DateTimeDigitized", "DateTimeOriginal"} {
		dateText, err := e.propToString(key)
		if err != nil {
			return nil, err
		}

		if dateText == "" {
			continue
		}

		return parseExifDate(dateText)
	}

	return nil, nil
}

func parseExifDate(dateString string) (*time.Time, error) {
	fragments := strings.Split(dateString, " ")
	dateFragments := strings.Split(fragments[0], ":")
	timeFragments := strings.Split(fragments[1], ":")

	year, err := strconv.Atoi(dateFragments[0])
	if err != nil {
		return nil, err
	}

	month, err := strconv.Atoi(dateFragments[1])
	if err != nil {
		return nil, err
	}
	day, err := strconv.Atoi(dateFragments[2])
	if err != nil {
		return nil, err
	}

	hour, err := strconv.Atoi(timeFragments[0])
	if err != nil {
		return nil, err
	}

	minute, err := strconv.Atoi(timeFragments[1])
	if err != nil {
		return nil, err
	}

	second, err := strconv.Atoi(timeFragments[2])
	if err != nil {
		return nil, err
	}
	date := time.Date(year, time.Month(month), day, hour, minute, second, 0, time.UTC)
	return &date, nil
}
