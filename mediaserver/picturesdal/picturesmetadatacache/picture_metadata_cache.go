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

type mapByHash map[pictures.HashValue]pictures.MediaFile

type MediaFilesCache struct {
	mu         *sync.Mutex
	mediaFiles []pictures.MediaFile
	mapByHash  mapByHash
	hashValue  pictures.HashValue
}

func NewMediaFilesCache() *MediaFilesCache {
	return &MediaFilesCache{mu: &sync.Mutex{}, mapByHash: make(mapByHash)}
}

func (cache *MediaFilesCache) Add(mediaFile pictures.MediaFile) error {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	existingPicture := cache.mapByHash[mediaFile.GetHashValue()]
	if nil != existingPicture {
		return ErrItemAlreadyExists
	}

	cache.mapByHash[mediaFile.GetHashValue()] = mediaFile
	cache.mediaFiles = append(cache.mediaFiles, mediaFile)

	return cache.setHashValue()
}

func (cache *MediaFilesCache) AddBatch(mediaFiles ...pictures.MediaFile) {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	for _, mediaFile := range mediaFiles {
		existingPicture := cache.mapByHash[mediaFile.GetHashValue()]
		if nil != existingPicture {
			log.Printf("Picture metadata already found for %s at %s. Skipping add to cache.\n", existingPicture.GetHashValue(), existingPicture.GetRelativePath())
			continue
		}

		cache.mapByHash[mediaFile.GetHashValue()] = mediaFile
		cache.mediaFiles = append(cache.mediaFiles, mediaFile)
	}

	cache.setHashValue()
}

func (cache *MediaFilesCache) setHashValue() error {
	var byteBuffer bytes.Buffer
	encoder := gob.NewEncoder(&byteBuffer)
	err := encoder.Encode(cache.mediaFiles)
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

func (cache *MediaFilesCache) GetHashValue() pictures.HashValue {
	return cache.hashValue
}

func (cache *MediaFilesCache) GetAll() []pictures.MediaFile {
	return cache.mediaFiles
}

// can be nil if picture metadata not in cache
func (cache *MediaFilesCache) Get(hashValue pictures.HashValue) pictures.MediaFile {
	return cache.mapByHash[hashValue]
}
