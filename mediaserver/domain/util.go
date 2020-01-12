package domain

import (
	"bytes"
	"encoding/gob"
	"path/filepath"
	"strings"
)

func gobClone(from, to interface{}) {
	bb := bytes.NewBuffer(nil)
	err := gob.NewEncoder(bb).Encode(from)
	if err != nil {
		panic(err)
	}

	err = gob.NewDecoder(bb).Decode(to)
	if err != nil {
		panic(err)
	}
}

func GetFileTypeFromPath(path string) MediaFileType {
	fileExtensionLower := strings.ToLower(filepath.Ext(path))
	switch fileExtensionLower {
	case ".jpg", ".jpeg", ".png":
		return MediaFileTypePicture
	case ".mp4":
		return MediaFileTypeVideo
	case ".fit":
		return MediaFileTypeFitTrack
	default:
		return MediaFileTypeUnknown
	}
}
