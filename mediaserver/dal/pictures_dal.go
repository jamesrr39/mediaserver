package dal

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"image"
	"io"
	"log"
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/semaphore"
)

var ErrHashNotFound = errors.New("hash not found")

type PicturesDAL struct {
	thumbnailsDAL *ThumbnailsDAL
	openFileFunc  openFileFuncType
	sema          *semaphore.Semaphore
}

func NewPicturesDAL(
	cachesBasePath string, thumbnailsDAL *ThumbnailsDAL, openFileFunc openFileFuncType, maxConcurrentResizes uint) *PicturesDAL {
	return &PicturesDAL{thumbnailsDAL, openFileFunc, semaphore.NewSemaphore(maxConcurrentResizes)}
}

func (dal *PicturesDAL) GetPictureBytes(pictureMetadata *domain.PictureMetadata, size domain.Size) (io.Reader, string, errorsx.Error) {
	isSizeCachable := dal.thumbnailsDAL.IsSizeCacheable(size)
	if isSizeCachable {
		// look in on-disk cache for thumbnail
		file, pictureFormat, err := dal.thumbnailsDAL.Get(pictureMetadata.HashValue, size)
		if nil == err && nil != file {
			return file, pictureFormat, nil
		}

		if nil != err {
			log.Printf("ERROR getting thumbnail from cache for hash: '%s'. Error: '%s'\n", pictureMetadata.HashValue, err)
		}
	}

	picture, pictureFormat, err := dal.GetPicture(pictureMetadata)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	dal.sema.Add()
	defer dal.sema.Done()

	picture = domain.ResizePicture(picture, size)

	pictureBytes, err := domain.EncodePicture(picture, pictureFormat)
	if err != nil {
		return nil, "", errorsx.Wrap(err)
	}

	if isSizeCachable {
		go dal.thumbnailsDAL.save(pictureMetadata.HashValue, size, pictureFormat, pictureBytes)
	}
	return bytes.NewBuffer(pictureBytes), pictureFormat, nil
}

func (dal *PicturesDAL) GetPicture(pictureMetadata *domain.PictureMetadata) (image.Image, string, error) {
	file, err := dal.openFileFunc(pictureMetadata)
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}
	defer file.Close()

	_, picture, err := domain.NewPictureMetadataAndPictureFromBytes(file, pictureMetadata.GetMediaFileInfo())
	if nil != err {
		return nil, "", errorsx.Wrap(err)
	}

	return picture, pictureMetadata.Format, nil
}

var ErrNotFound = errors.New("not found")

func (pr *PicturesDAL) GetPictureMetadata(tx *sql.Tx, mediaFileInfo domain.MediaFileInfo) (*domain.PictureMetadata, error) {

	row := tx.QueryRow(`
SELECT file_size_bytes, exif_data_json, raw_size_width, raw_size_height, format
FROM pictures_metadatas
WHERE hash == $1
    `, mediaFileInfo.HashValue)

	var fileSizeBytes int64
	var exifDataJSON, format string
	var rawSizeWidth, rawSizeHeight uint
	err := row.Scan(&fileSizeBytes, &exifDataJSON, &rawSizeWidth, &rawSizeHeight, &format)
	if nil != err {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}

		return nil, errorsx.Wrap(err)
	}

	var exifData *domain.ExifData
	if exifDataJSON != "" {
		err = json.NewDecoder(bytes.NewBuffer([]byte(exifDataJSON))).Decode(&exifData)
		if nil != err {
			return nil, errorsx.Wrap(err)
		}
	}

	rawSize := domain.RawSize{
		Width:  rawSizeWidth,
		Height: rawSizeHeight,
	}

	return domain.NewPictureMetadata(mediaFileInfo, exifData, rawSize, format), nil
}

func (pr *PicturesDAL) CreatePictureMetadata(tx *sql.Tx, pictureMetadata *domain.PictureMetadata) error {
	var exifDataJSON string
	if nil != pictureMetadata.ExifData {
		byteBuffer := bytes.NewBuffer(nil)
		err := json.NewEncoder(byteBuffer).Encode(pictureMetadata.ExifData)
		if nil != err {
			return errorsx.Wrap(err)
		}
		exifDataJSON = string(byteBuffer.Bytes())
	}

	_, err := tx.Exec(`
INSERT INTO pictures_metadatas(hash, file_size_bytes, exif_data_json, raw_size_width, raw_size_height, format)
VALUES($1, $2, $3, $4, $5, $6)
`, pictureMetadata.HashValue, pictureMetadata.FileSizeBytes, exifDataJSON, pictureMetadata.RawSize.Width, pictureMetadata.RawSize.Height, pictureMetadata.Format)

	return errorsx.Wrap(err)
}
