package domain

import (
	"bytes"
	"encoding/json"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/goutil/errorsx"
)

func gobClone(from, to interface{}) {
	bb := bytes.NewBuffer(nil)
	err := json.NewEncoder(bb).Encode(from)
	if err != nil {
		panic(err)
	}

	err = json.NewDecoder(bb).Decode(to)
	if err != nil {
		panic(err)
	}
}

func GetFileTypeFromPath(path string) (MediaFileType, errorsx.Error) {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".jpg", ".jpeg", ".png":
		return MediaFileTypePicture, nil
	case ".mp4":
		return MediaFileTypeVideo, nil
	case ".fit", ".gpx":
		return MediaFileTypeFitTrack, nil
	default:
		return MediaFileTypeUnknown, errorsx.Errorf("unknown extension %q from file path %q", ext, path)
	}
}
