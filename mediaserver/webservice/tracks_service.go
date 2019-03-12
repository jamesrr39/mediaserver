package webservice

import (
	"fmt"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/domain"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type TracksWebService struct {
	log           *logpkg.Logger
	tracksDAL     *dal.TracksDAL
	mediaFilesDAL *dal.MediaFilesDAL
	chi.Router
}

func NewTracksWebService(log *logpkg.Logger, tracksDAL *dal.TracksDAL, mediaFilesDAL *dal.MediaFilesDAL) *TracksWebService {
	router := chi.NewRouter()

	s := &TracksWebService{log, tracksDAL, mediaFilesDAL, router}

	router.Get("/{hash}/records", s.handleGetTrackRecords)

	return s
}

func (s *TracksWebService) handleGetTrackRecords(w http.ResponseWriter, r *http.Request) {
	hash := chi.URLParam(r, "hash")
	if "" == hash {
		errorsx.HTTPError(w, s.log, errorsx.Errorf(http.StatusText(422)), 422)
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
		errorsx.HTTPError(w, s.log, err, 500)
		return
	}

	render.JSON(w, r, records)
}
