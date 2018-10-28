package domain

type VideoFileMetadata struct {
	MediaFileInfo
}

func NewVideoFileMetadata(hashValue HashValue, relativePath string, fileSizeBytes int64) *VideoFileMetadata {
	return &VideoFileMetadata{MediaFileInfo{relativePath, hashValue, MediaFileTypeVideo, fileSizeBytes}}
}

func (pm *VideoFileMetadata) GetMediaFileInfo() MediaFileInfo {
	return pm.MediaFileInfo
}
