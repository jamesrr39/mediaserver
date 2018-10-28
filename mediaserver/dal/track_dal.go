package dal

import "mediaserverapp/mediaserver/domain"

type TracksDAL struct {
	mediaFileDAL *MediaFilesDAL
}

func NewTracksDAL(mediaFileDAL *MediaFilesDAL) *TracksDAL {
	return &TracksDAL{mediaFileDAL}
}

func (dal *TracksDAL) GetRecords(track *domain.FitFileSummary) ([]*domain.Record, error) {
	file, err := dal.mediaFileDAL.OpenFile(track)
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
