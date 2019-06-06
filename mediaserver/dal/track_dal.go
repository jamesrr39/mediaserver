package dal

import (
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/semaphore"
)

type openFileFuncType func(domain.MediaFile) (gofs.File, error)

type TracksDAL struct {
	openFileFunc openFileFuncType
	sema         *semaphore.Semaphore
}

func NewTracksDAL(openFileFunc openFileFuncType, maxConcurrentRequests uint) *TracksDAL {
	return &TracksDAL{openFileFunc, semaphore.NewSemaphore(maxConcurrentRequests)}
}

func (dal *TracksDAL) GetRecords(track *domain.FitFileSummary) (domain.Records, errorsx.Error) {
	dal.sema.Add()
	defer dal.sema.Done()

	file, err := dal.openFileFunc(track)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer file.Close()

	records, err := domain.GetTrackRecordsFromReader(track.GetMediaFileInfo(), file)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return records, nil
}
