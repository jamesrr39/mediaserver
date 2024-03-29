package picturesmetadatacache

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"log"
	"mediaserver/mediaserver/domain"
	"sync"

	"github.com/jamesrr39/goutil/errorsx"
)

type mapByHash map[domain.HashValue]domain.MediaFile

type MediaFilesCache struct {
	mu         *sync.RWMutex
	mediaFiles []domain.MediaFile
	mapByHash  mapByHash
	hashValue  domain.HashValue
}

func NewMediaFilesCache() *MediaFilesCache {
	return &MediaFilesCache{mu: &sync.RWMutex{}, mapByHash: make(mapByHash)}
}

func (cache *MediaFilesCache) Add(mediaFile domain.MediaFile) error {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	_, ok := cache.mapByHash[mediaFile.GetMediaFileInfo().HashValue]
	if ok {
		return ErrItemAlreadyExists
	}

	cache.mapByHash[mediaFile.GetMediaFileInfo().HashValue] = mediaFile
	cache.mediaFiles = append(cache.mediaFiles, mediaFile)

	return cache.setHashValue()
}

func (cache *MediaFilesCache) setHashValue() error {
	var byteBuffer bytes.Buffer
	encoder := json.NewEncoder(&byteBuffer)
	err := encoder.Encode(cache.mediaFiles)
	if nil != err {
		return errorsx.Wrap(err)
	}
	hash := sha1.New()
	hash.Write(byteBuffer.Bytes())
	hashValue := hex.EncodeToString(hash.Sum(nil))
	log.Println("setting hashvalue to " + hashValue)
	cache.hashValue = domain.HashValue(hashValue)

	return nil
}

func (cache *MediaFilesCache) GetHashValue() domain.HashValue {
	return cache.hashValue
}

func (cache *MediaFilesCache) GetAll() []domain.MediaFile {
	cache.mu.RLock()
	cache.mu.RUnlock()
	return cache.mediaFiles
}

// can be nil if picture metadata not in cache
func (cache *MediaFilesCache) Get(hashValue domain.HashValue) domain.MediaFile {
	cache.mu.RLock()
	cache.mu.RUnlock()
	return cache.mapByHash[hashValue]
}

func (cache *MediaFilesCache) UpdateMediaFiles(mediaFiles []domain.MediaFile) {
	mapByHash := make(mapByHash)

	for _, mediaFile := range mediaFiles {
		existingPicture := mapByHash[mediaFile.GetMediaFileInfo().HashValue]
		if nil != existingPicture {
			log.Printf("Picture metadata already found for %s at %s. Skipping add to cache.\n", existingPicture.GetMediaFileInfo().HashValue, existingPicture.GetMediaFileInfo().RelativePath)
			continue
		}

		mapByHash[mediaFile.GetMediaFileInfo().HashValue] = mediaFile
	}

	cache.mu.Lock()
	defer cache.mu.Unlock()

	cache.mediaFiles = mediaFiles
	cache.mapByHash = mapByHash

	cache.setHashValue()
}
