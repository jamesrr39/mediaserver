package picturesmetadatacache

import (
	"bytes"
	"crypto/sha1"
	"encoding/gob"
	"encoding/hex"
	"log"
	"mediaserverapp/mediaserver/pictures"
	"sync"
)

type PicturesMetadataCache struct {
	mu                *sync.Mutex
	picturesMetadatas []pictures.MediaFile
	mapByHash         map[pictures.HashValue]pictures.MediaFile
	hashValue         pictures.HashValue
}

func NewPicturesMetadataCache() *PicturesMetadataCache {
	return &PicturesMetadataCache{mu: &sync.Mutex{}, mapByHash: make(map[pictures.HashValue]pictures.MediaFile)}
}

func (cache *PicturesMetadataCache) Add(pictureMetadata *pictures.PictureMetadata) error {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	existingPicture := cache.mapByHash[pictureMetadata.HashValue]
	if nil != existingPicture {
		return ErrItemAlreadyExists
	}

	cache.mapByHash[pictureMetadata.HashValue] = pictureMetadata
	cache.picturesMetadatas = append(cache.picturesMetadatas, pictureMetadata)

	return cache.setHashValue()
}

func (cache *PicturesMetadataCache) AddBatch(picturesMetadata ...pictures.MediaFile) {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	for _, pictureMetadata := range picturesMetadata {
		existingPicture := cache.mapByHash[pictureMetadata.GetHashValue()]
		if nil != existingPicture {
			log.Printf("Picture metadata already found for %s at %s. Skipping add to cache.\n", existingPicture.GetHashValue(), existingPicture.GetRelativePath())
			continue
		}

		cache.mapByHash[pictureMetadata.GetHashValue()] = pictureMetadata
		cache.picturesMetadatas = append(cache.picturesMetadatas, pictureMetadata)
	}

	cache.setHashValue()
}

func (cache *PicturesMetadataCache) setHashValue() error {
	var byteBuffer bytes.Buffer
	encoder := gob.NewEncoder(&byteBuffer)
	err := encoder.Encode(cache.picturesMetadatas)
	if nil != err {
		return err
	}
	hash := sha1.New()
	hash.Write(byteBuffer.Bytes())
	hashValue := hex.EncodeToString(hash.Sum(nil))
	log.Println("setting hashvalue to " + hashValue)
	cache.hashValue = pictures.HashValue(hashValue)

	return nil
}

func (cache *PicturesMetadataCache) GetHashValue() pictures.HashValue {
	return cache.hashValue
}

func (cache *PicturesMetadataCache) GetAll() []pictures.MediaFile {
	return cache.picturesMetadatas
}

// can be nil if picture metadata not in cache
func (cache *PicturesMetadataCache) Get(hashValue pictures.HashValue) pictures.MediaFile {
	return cache.mapByHash[hashValue]
}
