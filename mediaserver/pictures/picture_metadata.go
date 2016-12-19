package pictures

type HashValue string

type PictureMetadata struct {
	HashValue
	RelativeFilePath string
	FileSizeBytes    int64
}

func NewPictureMetadata(hashValue HashValue, relativeFilePath string, fileSizeBytes int64) *PictureMetadata {
	return &PictureMetadata{hashValue, relativeFilePath, fileSizeBytes}
}
