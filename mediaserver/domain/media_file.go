package domain

type MediaFileType int

const (
	MediaFileTypePicture  MediaFileType = 1
	MediaFileTypeVideo    MediaFileType = 2
	MediaFileTypeFitTrack MediaFileType = 3
)

type MediaFileInfo struct {
	RelativePath  string        `json:"relativePath"`
	HashValue     HashValue     `json:"hashValue"`
	MediaFileType MediaFileType `json:"fileType"`
	FileSizeBytes int64         `json:"fileSizeBytes"`
}

func NewMediaFileInfo(
	relativePath string,
	hashValue HashValue,
	mediaFileType MediaFileType,
	fileSizeBytes int64,
) MediaFileInfo {
	return MediaFileInfo{relativePath, hashValue, mediaFileType, fileSizeBytes}
}

type MediaFile interface {
	GetMediaFileInfo() MediaFileInfo
}

func GetPicturesMetadatasFromMediaFileList(mediaFiles []MediaFile) []*PictureMetadata {
	var picturesMetadatas []*PictureMetadata
	for _, mediaFile := range mediaFiles {
		if mediaFile.GetMediaFileInfo().MediaFileType == MediaFileTypePicture {
			picturesMetadatas = append(picturesMetadatas, mediaFile.(*PictureMetadata))
		}
	}
	return picturesMetadatas
}
