package domain

type MediaFileType int

const (
	MediaFileTypePicture  MediaFileType = 1
	MediaFileTypeVideo    MediaFileType = 2
	MediaFileTypeFitTrack MediaFileType = 3
)

type MediaFileInfo struct {
	RelativePath   string        `json:"relativePath"`
	HashValue      HashValue     `json:"hashValue"`
	MediaFileType  MediaFileType `json:"fileType"`
	FileSizeBytes  int64         `json:"fileSizeBytes"`
	ParticipantIDs []int64       `json:"participantIds"`
}

func NewMediaFileInfo(
	relativePath string,
	hashValue HashValue,
	mediaFileType MediaFileType,
	fileSizeBytes int64,
	participantIDs []int64,
) MediaFileInfo {
	return MediaFileInfo{relativePath, hashValue, mediaFileType, fileSizeBytes, participantIDs}
}

type MediaFile interface {
	GetMediaFileInfo() MediaFileInfo
	Clone() MediaFile
}
