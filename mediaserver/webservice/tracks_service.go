package webservice

import (
	"fmt"
	"net/http"

	"mediaserverapp/mediaserver/dal"
	"mediaserverapp/mediaserver/domain"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

type TracksWebService struct {
	tracksDAL     *dal.TracksDAL
	mediaFilesDAL *dal.MediaFilesDAL
	chi.Router
}

func NewTracksWebService(tracksDAL *dal.TracksDAL, mediaFilesDAL *dal.MediaFilesDAL) *TracksWebService {
	router := chi.NewRouter()

	s := &TracksWebService{tracksDAL, mediaFilesDAL, router}

	router.Get("/{hash}/records", s.handleGetTrackRecords)

	return s
}

func (s *TracksWebService) handleGetTrackRecords(w http.ResponseWriter, r *http.Request) {
	hash := chi.URLParam(r, "hash")
	if "" == hash {
		http.Error(w, http.StatusText(422), 422)
		return
	}

	mediaFile := s.mediaFilesDAL.Get(domain.HashValue(hash))
	if mediaFile == nil {
		http.NotFound(w, r)
		return
	}

	if mediaFile.GetMediaFileInfo().MediaFileType != domain.MediaFileTypeFitTrack {
		http.Error(
			w,
			fmt.Sprintf("unexpected file type (expected %d, got %d)", domain.MediaFileTypeFitTrack, mediaFile.GetMediaFileInfo().MediaFileType),
			400,
		)
		return
	}

	records, err := s.tracksDAL.GetRecords(mediaFile.(*domain.FitFileSummary))
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	render.JSON(w, r, records)
}
