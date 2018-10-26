package domain

type VideoFileMetadata struct {
	HashValue        `json:"hashValue"`
	MediaFileType    `json:"fileType"`
	RelativeFilePath string `json:"relativeFilePath"`
	FileSizeBytes    int64  `json:"fileSizeBytes"`
}

func NewVideoFileMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64) *VideoFileMetadata {
	return &VideoFileMetadata{hashValue, MediaFileTypeVideo, relativeFilePath, fileSizeBytes}
}

func (pm *VideoFileMetadata) GetRelativePath() string {
	return pm.RelativeFilePath
}
func (pm *VideoFileMetadata) GetHashValue() HashValue {
	return pm.HashValue
}
func (pm *VideoFileMetadata) GetMediaFileType() MediaFileType {
	return MediaFileTypeVideo
}
func (pm *VideoFileMetadata) GetFileSizeBytes() int64 {
	return pm.FileSizeBytes
}
