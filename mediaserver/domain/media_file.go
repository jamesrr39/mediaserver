package domain

import (
	"os"
	"time"
)

type MediaFileType int

const (
	MediaFileTypeUnknown  MediaFileType = 0
	MediaFileTypePicture  MediaFileType = 1
	MediaFileTypeVideo    MediaFileType = 2
	MediaFileTypeFitTrack MediaFileType = 3
)

var names = []string{
	"unknown",
	"picture",
	"video",
	"track",
}

func (m MediaFileType) String() string {
	return names[m]
}

type MediaFileInfo struct {
	RelativePath   string        `json:"relativePath"`
	HashValue      HashValue     `json:"hashValue"`
	MediaFileType  MediaFileType `json:"fileType"`
	FileSizeBytes  int64         `json:"fileSizeBytes"`
	ParticipantIDs []int64       `json:"participantIds"`
	FileModTime    time.Time     `json:"fileModTime"`
	FileMode       os.FileMode   `json:"fileMode"`
}

func NewMediaFileInfo(
	relativePath string,
	hashValue HashValue,
	mediaFileType MediaFileType,
	fileSizeBytes int64,
	participantIDs []int64,
	fileModTime time.Time,
	fileMode os.FileMode,
) MediaFileInfo {
	return MediaFileInfo{relativePath, hashValue, mediaFileType, fileSizeBytes, participantIDs, fileModTime, fileMode}
}

type MediaFile interface {
	GetMediaFileInfo() MediaFileInfo
	Clone() MediaFile
}
