package webservice

import (
	"bytes"
	"mediaserver/mediaserver/domain"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_GraphQLAPIService(t *testing.T) {
	logger := logpkg.NewLogger(os.Stderr, logpkg.LogLevelInfo)
	tracksDAL := &mockTrackDAL{
		GetRecordsFunc: func(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error) {
			return domain.Records{{
				Timestamp:    time.Date(1970, 01, 01, 00, 00, 01, 0, time.UTC),
				Distance:     1,
				PositionLat:  1.5,
				PositionLong: 2.5,
				Altitude:     3,
			}}, nil
		},
	}
	mediaFilesDAL := &mockMediaFileDAL{
		GetFunc: func(hash domain.HashValue) domain.MediaFile {
			return &domain.FitFileSummary{}
		},
	}

	ws, err := NewGraphQLAPIService(logger, tracksDAL, mediaFilesDAL)
	require.NoError(t, err)

	t.Run("GET", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodGet, `/?query={tracks(hashes:["abcdef123456"]){hash,records{timestamp,distance,posLat,posLong,altitude}}}`, nil)
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, expectedResponse, w.Body.String())
	})
	t.Run("POST application/json", func(t *testing.T) {
		postBody := bytes.NewBufferString(`{
			"query":"{tracks(hashes:[\"abcdef123456\"]){hash,records{timestamp,distance,posLat,posLong,altitude}}}"
		}`)
		r, err := http.NewRequest(http.MethodPost, "/", postBody)
		r.Header.Set("content-type", "application/json")
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, expectedResponse, w.Body.String())
	})
	t.Run("POST application/graphql", func(t *testing.T) {
		postBody := bytes.NewBufferString(`{
			tracks(hashes:["abcdef123456"]) {
				hash
				records {
					timestamp
					distance
					posLat
					posLong
					altitude
				}
			}
		}`)
		r, err := http.NewRequest(http.MethodPost, "/", postBody)
		r.Header.Set("content-type", "application/graphql")
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, expectedResponse, w.Body.String())
	})
}

const expectedResponse = `{"data":{"tracks":[{"hash":"abcdef123456","records":[{"altitude":3,"distance":1,"posLat":1.5,"posLong":2.5,"timestamp":"1970-01-01T00:00:01Z"}]}]}}
`

type mockTrackDAL struct {
	GetRecordsFunc func(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error)
}

func (m *mockTrackDAL) GetRecords(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error) {
	return m.GetRecordsFunc(mediaFile)
}

type mockMediaFileDAL struct {
	GetFunc func(hash domain.HashValue) domain.MediaFile
}

func (m *mockMediaFileDAL) Get(hash domain.HashValue) domain.MediaFile {
	return m.GetFunc(hash)
}
