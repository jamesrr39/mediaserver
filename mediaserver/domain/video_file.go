package domain

type VideoFileMetadata struct {
	MediaFileInfo
}

func NewVideoFileMetadata(mediaFileInfo MediaFileInfo) *VideoFileMetadata {
	return &VideoFileMetadata{mediaFileInfo}
}

func (pm *VideoFileMetadata) GetMediaFileInfo() MediaFileInfo {
	return pm.MediaFileInfo
}
