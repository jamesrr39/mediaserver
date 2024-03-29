package webservice

import (
	"bytes"
	"database/sql"
	"io/ioutil"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/domain"
	"mediaserver/mediaserver/testutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	snapshot "github.com/jamesrr39/go-snapshot-testing"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_GraphQLAPIService_tracks(t *testing.T) {
	logger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)
	tracksDAL := &mockTrackDAL{
		GetRecordsFunc: func(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error) {
			return domain.Records{{
				Timestamp:          time.Date(1970, 01, 01, 00, 00, 01, 0, time.UTC),
				CumulativeDistance: 1,
				PositionLat:        1.5,
				PositionLong:       2.5,
				Altitude:           3,
			}}, nil
		},
	}
	mediaFilesDAL := &mockMediaFileDAL{
		GetFunc: func(hash domain.HashValue) domain.MediaFile {
			return &domain.FitFileSummary{}
		},
	}

	ws, err := NewGraphQLAPIService(logger, nil, tracksDAL, mediaFilesDAL, nil)
	require.NoError(t, err)

	t.Run("GET", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodGet, `/?query={tracks(hashes:["abcdef123456"]){hash,records{timestamp,distance,posLat,posLong,altitude}}}`, nil)
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		require.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "query_tracks", snapshot.NewTextSnapshot(w.Body.String()))
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

		assert.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "query_tracks", snapshot.NewTextSnapshot(w.Body.String()))
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
		require.NoError(t, err)
		r.Header.Set("content-type", "application/graphql")
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		require.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "query_tracks", snapshot.NewTextSnapshot(w.Body.String()))
	})
}

// const expectedResponse = `{"data":{"tracks":[{"hash":"abcdef123456","records":[{"altitude":3,"distance":1,"posLat":1.5,"posLong":2.5,"timestamp":"1970-01-01T00:00:01Z"}]}]}}
// `

type mockTrackDAL struct {
	GetRecordsFunc func(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error)
}

func (m *mockTrackDAL) GetRecords(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error) {
	return m.GetRecordsFunc(mediaFile)
}

type mockMediaFileDAL struct {
	GetFunc    func(hash domain.HashValue) domain.MediaFile
	GetAllFunc func() []domain.MediaFile
	UpdateFunc func(tx *sql.Tx, mediaFile domain.MediaFile, properties ...dal.MediaFileUpdateProperty) errorsx.Error
}

func (m *mockMediaFileDAL) Get(hash domain.HashValue) domain.MediaFile {
	return m.GetFunc(hash)
}

func (m *mockMediaFileDAL) GetAll() []domain.MediaFile {
	return m.GetAllFunc()
}

func (m *mockMediaFileDAL) Update(tx *sql.Tx, mediaFile domain.MediaFile, properties ...dal.MediaFileUpdateProperty) errorsx.Error {
	return m.UpdateFunc(tx, mediaFile, properties...)
}

type mockPeopleDAL struct {
	GetAllPeopleFunc func(tx *sql.Tx) ([]*domain.Person, errorsx.Error)
	CreatePersonFunc func(tx *sql.Tx, person *domain.Person) errorsx.Error
}

func (m *mockPeopleDAL) GetAllPeople(tx *sql.Tx) ([]*domain.Person, errorsx.Error) {
	return m.GetAllPeopleFunc(tx)
}

func (m *mockPeopleDAL) CreatePerson(tx *sql.Tx, person *domain.Person) errorsx.Error {
	return m.CreatePersonFunc(tx, person)
}

func Test_GraphQLAPIService_people(t *testing.T) {
	logger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)

	peopleDAL := &mockPeopleDAL{
		GetAllPeopleFunc: func(tx *sql.Tx) ([]*domain.Person, errorsx.Error) {
			return []*domain.Person{
				{
					ID:   1,
					Name: "Test User 1",
				},
				{
					ID:   2,
					Name: "Test User 2",
				},
			}, nil
		},
	}

	dbConn := testutil.NewTestDB(t)
	defer dbConn.Close()

	ws, err := NewGraphQLAPIService(logger, dbConn.DBConn, nil, nil, peopleDAL)
	require.NoError(t, err)

	t.Run("GET", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodGet, `/?query={people{id,name}}`, nil)
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		assert.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "GET_people", snapshot.NewTextSnapshot(w.Body.String()))
	})
}

func Test_GraphQLAPIService_mediafiles(t *testing.T) {
	logger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)

	mediaFilesDAL := &mockMediaFileDAL{
		GetAllFunc: func() []domain.MediaFile {
			return []domain.MediaFile{
				&domain.VideoFileMetadata{
					MediaFileInfo: domain.MediaFileInfo{
						RelativePath:   "a/b/c.ogv",
						MediaFileType:  domain.MediaFileTypeVideo,
						ParticipantIDs: []int64{1, 7},
						FileSizeBytes:  20,
					},
				},
				&domain.PictureMetadata{
					MediaFileInfo: domain.MediaFileInfo{
						RelativePath: "d/e.png",
					},
					RawSize: domain.RawSize{
						Width:  1024,
						Height: 768,
					},
				},
			}
		},
	}

	ws, err := NewGraphQLAPIService(logger, nil, nil, mediaFilesDAL, nil)
	require.NoError(t, err)

	t.Run("GET", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodGet, `/?query={mediaFiles{videos{relativePath,participantIds,fileSizeBytes},pictures{relativePath,rawSize{width,height},participantIds}}}`, nil)
		require.NoError(t, err)
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		assert.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "GET_mediafiles", snapshot.NewTextSnapshot(w.Body.String()))
	})
}

const mutationBody = `mutation {
	updateMediaFiles(hashes: ["abc"], participantIds: [1, 2]) {pictures{hashValue, participantIds},videos{hashValue, participantIds}}
}
`

func Test_mutation_update_mediafiles(t *testing.T) {
	logger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)

	mediaFilesDAL := &mockMediaFileDAL{
		GetFunc: func(hash domain.HashValue) domain.MediaFile {
			return &domain.VideoFileMetadata{
				MediaFileInfo: domain.MediaFileInfo{
					RelativePath: "a/b/c.ogv",
					HashValue:    hash,
				},
			}
		},
		UpdateFunc: func(tx *sql.Tx, mediaFile domain.MediaFile, properties ...dal.MediaFileUpdateProperty) errorsx.Error {
			return nil
		},
	}

	testDBConn := testutil.NewTestDB(t)

	ws, err := NewGraphQLAPIService(logger, testDBConn.DBConn, nil, mediaFilesDAL, nil)
	require.NoError(t, err)

	t.Run("POST", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodPost, `/`, bytes.NewBufferString(mutationBody))
		require.NoError(t, err)
		r.Header.Set("content-type", "application/graphql")
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		assert.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "update_mediafiles_mutation", snapshot.NewTextSnapshot(w.Body.String()))
	})
}

func Test_mutation_create_people(t *testing.T) {
	logger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)

	testDBConn := testutil.NewTestDB(t)

	personCount := int64(1)
	peopleDAL := &mockPeopleDAL{
		CreatePersonFunc: func(tx *sql.Tx, person *domain.Person) errorsx.Error {
			person.ID = personCount
			personCount++
			return nil
		},
	}

	ws, err := NewGraphQLAPIService(logger, testDBConn.DBConn, nil, nil, peopleDAL)
	require.NoError(t, err)

	t.Run("POST", func(t *testing.T) {
		r, err := http.NewRequest(http.MethodPost, `/`, bytes.NewBufferString(`
		mutation {
			createPeople(names: ["abc", "def"]) {id, name}
		}
		`))
		require.NoError(t, err)
		r.Header.Set("content-type", "application/graphql")
		w := httptest.NewRecorder()
		ws.ServeHTTP(w, r)

		assert.Equal(t, http.StatusOK, w.Code)
		snapshot.AssertMatchesSnapshot(t, "create_people_mutation", snapshot.NewTextSnapshot(w.Body.String()))
	})
}
