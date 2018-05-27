package diskstorage

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"mediaserverapp/mediaserver/pictures"
)

type PicturesMetadataRepository struct {
}

func NewPicturesMetadataRepository() *PicturesMetadataRepository {
	return &PicturesMetadataRepository{}
}

var ErrNotFound = errors.New("not found")

func (pr *PicturesMetadataRepository) GetPictureMetadata(tx *sql.Tx, hash pictures.HashValue, relativeFilePath string) (*pictures.PictureMetadata, error) {

	row := tx.QueryRow(`
SELECT file_size_bytes, exif_data_json, raw_size_width, raw_size_height, format
FROM pictures_metadatas
WHERE hash == $1
    `, hash)

	var fileSizeBytes int64
	var exifDataJSON, format string
	var rawSizeWidth, rawSizeHeight uint
	err := row.Scan(&fileSizeBytes, &exifDataJSON, &rawSizeWidth, &rawSizeHeight, &format)
	if nil != err {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}

		return nil, err
	}

	var exifData *pictures.ExifData
	if exifDataJSON != "" {
		err = json.NewDecoder(bytes.NewBuffer([]byte(exifDataJSON))).Decode(&exifData)
		if nil != err {
			return nil, err
		}
	}

	rawSize := pictures.RawSize{
		Width:  rawSizeWidth,
		Height: rawSizeHeight,
	}

	return pictures.NewPictureMetadata(hash, relativeFilePath, fileSizeBytes, exifData, rawSize, format), nil
}

func (pr *PicturesMetadataRepository) CreatePictureMetadata(tx *sql.Tx, pictureMetadata *pictures.PictureMetadata) error {
	var exifDataJSON string
	if nil != pictureMetadata.ExifData {
		byteBuffer := bytes.NewBuffer(nil)
		err := json.NewEncoder(byteBuffer).Encode(pictureMetadata.ExifData)
		if nil != err {
			return err
		}
		exifDataJSON = string(byteBuffer.Bytes())
	}

	_, err := tx.Exec(`
INSERT INTO pictures_metadatas(hash, file_size_bytes, exif_data_json, raw_size_width, raw_size_height, format)
VALUES($1, $2, $3, $4, $5, $6)
`, pictureMetadata.HashValue, pictureMetadata.FileSizeBytes, exifDataJSON, pictureMetadata.RawSize.Width, pictureMetadata.RawSize.Height, pictureMetadata.Format)

	return err
}
