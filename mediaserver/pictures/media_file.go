package pictures

type MediaFileType int

const (
	MediaFileTypePicture MediaFileType = 1
	MediaFileTypeVideo   MediaFileType = 2
)

type MediaFile interface {
	GetRelativePath() string
	GetHashValue() HashValue
	GetMediaFileType() MediaFileType
	GetFileSizeBytes() int64
}

func GetPicturesMetadatasFromMediaFileList(mediaFiles []MediaFile) []*PictureMetadata {
	var picturesMetadatas []*PictureMetadata
	for _, mediaFile := range mediaFiles {
		if mediaFile.GetMediaFileType() == MediaFileTypePicture {
			picturesMetadatas = append(picturesMetadatas, mediaFile.(*PictureMetadata))
		}
	}
	return picturesMetadatas
}
