package picturesdal

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/picturesdal/picturescache"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

type PicturesDAL struct {
	rootpath string
	cache    *picturescache.PicturesCache
}

func NewPicturesDAL(rootpath string) *PicturesDAL {
	return &PicturesDAL{rootpath, picturescache.NewPicturesCache()}
}

func (dal *PicturesDAL) GetAll() []*pictures.PictureMetadata {
	return dal.cache.GetAll()
}

func (dal *PicturesDAL) GetStateHashCode() pictures.HashValue {
	return dal.cache.GetHashValue()
}

// can be null if no metadata
func (dal *PicturesDAL) Get(hashValue pictures.HashValue) *pictures.PictureMetadata {
	return dal.cache.Get(hashValue)
}

func (dal *PicturesDAL) Create(file io.Reader, filename string, contentType string) (*pictures.PictureMetadata, error) {

	if strings.Contains(filename, ".."+string(filepath.Separator)) {
		return nil, errors.New("filename contains ..")
	}

	var fileByteBuffer bytes.Buffer
	_, err := io.Copy(&fileByteBuffer, file)

	fileHash, err := hashOfFile(bytes.NewBuffer(fileByteBuffer.Bytes()))
	if nil != err {
		return nil, err
	}

	if nil != dal.Get(fileHash) {
		return nil, errors.New("a file with this hash already exists")
	}

	exifData, err := exif.Decode(bytes.NewBuffer(fileByteBuffer.Bytes()))
	if nil != err {
		log.Printf("not able to read metadata. Error: %s\n", err)
	}

	folder := filepath.Join(dal.rootpath, "uploads", strings.Split(time.Now().Format(time.RFC3339), "T")[0])
	err = os.MkdirAll(folder, 0755)
	if nil != err {
		return nil, err
	}

	path, err := getPathForNewFile(folder, filename)
	if nil != err {
		return nil, err
	}
	log.Println("writing to " + path)
	err = ioutil.WriteFile(path, fileByteBuffer.Bytes(), 0644)
	if nil != err {
		return nil, err
	}

	fileinfo, err := os.Stat(path)
	if nil != err {
		return nil, err
	}

	pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.rootpath), fileinfo.Size(), exifData)
	dal.cache.Add(pictureMetadata)

	return pictureMetadata, nil
}

func (dal *PicturesDAL) UpdatePicturesCache() error {
	var picturesMetadatas []*pictures.PictureMetadata

	err := filepath.Walk(dal.rootpath, func(path string, fileinfo os.FileInfo, err error) error {
		if nil != err {
			return err
		}

		if fileinfo.IsDir() {
			// skip
			return nil
		}

		fileExtensionLower := strings.ToLower(filepath.Ext(path))
		if fileExtensionLower != ".jpg" && fileExtensionLower != ".jpeg" && fileExtensionLower != ".png" {
			log.Println("skipping " + path + ", file extension (lower case) '" + fileExtensionLower + " not recognised")
			return nil
		}

		fileBytes, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}

		fileHash, err := hashOfFile(bytes.NewBuffer(fileBytes))
		if nil != err {
			return err
		}

		exifData, err := exif.Decode(bytes.NewBuffer(fileBytes))
		if nil != err {
			log.Printf("not able to read metadata for %s. Error: %s\n", path, err)
		}

		pictureMetadata := pictures.NewPictureMetadata(fileHash, strings.TrimPrefix(path, dal.rootpath), fileinfo.Size(), exifData)
		picturesMetadatas = append(picturesMetadatas, pictureMetadata) // todo concurrency

		return nil
	})

	if nil != err {
		return err
	}

	newCache := picturescache.NewPicturesCache()
	newCache.AddBatch(picturesMetadatas...)
	var mu sync.Mutex
	mu.Lock()
	dal.cache = newCache
	mu.Unlock()
	return nil
}

func getPathForNewFile(folder, filename string) (string, error) {

	fileExtension := filepath.Ext(filename)
	withoutExtension := strings.TrimSuffix(filename, fileExtension)

	for i := 0; i < 100000; i++ {
		name := withoutExtension
		if 0 != i {
			name += "_" + strconv.Itoa(i)
		}
		name += fileExtension

		path := filepath.Join(folder, name)
		_, err := os.Stat(path)
		if nil != err {
			if os.IsNotExist(err) {
				return path, nil
			}
			return "", err
		}
	}
	return "", errors.New("ran out of numbers for the new file")

}

// GetRawPicture returns a the raw picture for a piece of metadata
// it doesn't perform any transformations on the picture
func (picturesDAL *PicturesDAL) GetRawPicture(pictureMetadata *pictures.PictureMetadata) (image.Image, string, error) {
	file, err := os.Open(filepath.Join(picturesDAL.rootpath, pictureMetadata.RelativeFilePath))
	if nil != err {
		return nil, "", err
	}
	defer file.Close()

	log.Printf("opening file %v\n", *file)

	return image.Decode(file)
}

func hashOfFile(file io.Reader) (pictures.HashValue, error) {
	hasher := sha1.New()

	_, err := io.Copy(hasher, file)
	if nil != err {
		return "", err
	}

	return pictures.HashValue(hex.EncodeToString(hasher.Sum(nil))), nil
}
