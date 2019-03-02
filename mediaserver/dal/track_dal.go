package dal

import (
	"mediaserverapp/mediaserver/domain"

	"github.com/jamesrr39/goutil/gofs"
)

type openFileFuncType func(domain.MediaFile) (gofs.File, error)

type TracksDAL struct {
	openFileFunc openFileFuncType
}

func NewTracksDAL(openFileFunc openFileFuncType) *TracksDAL {
	return &TracksDAL{openFileFunc}
}

func (dal *TracksDAL) GetRecords(track *domain.FitFileSummary) (domain.Records, error) {
	file, err := dal.openFileFunc(track)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	records, err := domain.GetTrackRecordsFromReader(track.GetMediaFileInfo(), file)
	if err != nil {
		return nil, err
	}

	return records, nil
}
