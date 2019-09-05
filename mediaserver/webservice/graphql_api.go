package webservice

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi"
	"github.com/graphql-go/graphql"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

// https://www.freecodecamp.org/news/deep-dive-into-graphql-with-golang-d3e02a429ac3/

type GraphQLAPIService struct {
	logger        *logpkg.Logger
	schema        *graphql.Schema
	dbConn        *mediaserverdb.DBConn
	tracksDAL     tracksDALInterface
	mediaFilesDAL mediaFilesDALInterface
	peopleDAL     pepoleDALInterface
	chi.Router
}

type tracksDALInterface interface {
	GetRecords(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error)
}

type mediaFilesDALInterface interface {
	Get(hash domain.HashValue) domain.MediaFile
	GetAll() []domain.MediaFile
	Update(tx *sql.Tx, mediaFile domain.MediaFile, properties ...dal.MediaFileUpdateProperty) errorsx.Error
}

type pepoleDALInterface interface {
	GetAllPeople(tx *sql.Tx) ([]*domain.Person, errorsx.Error)
}

func NewGraphQLAPIService(logger *logpkg.Logger, dbConn *mediaserverdb.DBConn, tracksDAL tracksDALInterface, mediaFilesDAL mediaFilesDALInterface, peopleDAL pepoleDALInterface) (*GraphQLAPIService, errorsx.Error) {
	router := chi.NewRouter()
	ws := &GraphQLAPIService{logger, nil, dbConn, tracksDAL, mediaFilesDAL, peopleDAL, router}

	var schema, err = graphql.NewSchema(
		graphql.SchemaConfig{
			Query:    ws.setupQueryType(),
			Mutation: ws.setupMutationType(),
		},
	)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	ws.schema = &schema

	ws.Get("/", ws.handleGetGraphQLRequest)
	ws.Post("/", ws.handlePostGraphQLRequest)

	return ws, nil
}

func (ws *GraphQLAPIService) handleGetGraphQLRequest(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	ws.handleGraphQLRequest(w, r, query)
}

type graphQLPostJSONBody struct {
	Query string `json:"query"`
}

func (ws *GraphQLAPIService) handlePostGraphQLRequest(w http.ResponseWriter, r *http.Request) {
	var query string
	switch r.Header.Get("content-type") {
	case "application/json":
		var body graphQLPostJSONBody

		err := json.NewDecoder(r.Body).Decode(&body)
		if err != nil {
			errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusBadRequest)
			return
		}
		query = body.Query
	case "application/graphql":
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusBadRequest)
			return
		}
		query = string(body)
	default:
		errorsx.HTTPError(w, ws.logger, errorsx.Errorf("unsupported content type: %q", r.Header.Get("content-type")), http.StatusUnsupportedMediaType)
		return
	}

	ws.handleGraphQLRequest(w, r, query)
}

func (ws *GraphQLAPIService) handleGraphQLRequest(w http.ResponseWriter, r *http.Request, query string) {

	result := graphql.Do(graphql.Params{
		Schema:        *ws.schema,
		RequestString: query,
	})

	if result.HasErrors() {
		var errStrs []string
		for idx, err := range result.Errors {
			errStrs = append(errStrs, fmt.Sprintf("%d: %q", idx+1, err.Error()))
		}
		errorsx.HTTPError(w, ws.logger, errorsx.Errorf("errors processing graph QL query: \n%s\n", strings.Join(errStrs, "\n")), http.StatusBadRequest)
		return
	}

	err := json.NewEncoder(w).Encode(result)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
}

func (ws *GraphQLAPIService) setupMutationType() *graphql.Object {
	return graphql.NewObject(
		graphql.ObjectConfig{
			Name: "Mutation",
			Fields: graphql.Fields{
				"updateMediaFiles": &graphql.Field{
					Type:        mediaFilesMapType,
					Description: "mutate mediafile",
					Args: graphql.FieldConfigArgument{
						"hashes": &graphql.ArgumentConfig{
							Type: graphql.NewList(graphql.NewNonNull(graphql.String)),
						},
						"participantIds": &graphql.ArgumentConfig{
							Type: graphql.NewList(graphql.NewNonNull(graphql.Int)),
						},
					},
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						hashes, ok := params.Args["hashes"].([]interface{})
						if !ok {
							return nil, errorsx.Errorf("couldn't convert 'hashes' arg to []interface (was %T)", params.Args["hashes"])
						}

						participantIdsInterface, ok := params.Args["participantIds"].([]interface{})
						if !ok {
							return nil, errorsx.Errorf("couldn't convert 'participantIds' arg to []interface (was %T)", params.Args["hashes"])
						}

						var participantIds []int64
						for _, p := range participantIdsInterface {
							participantIds = append(participantIds, int64(p.(int)))
						}

						mediaFilesMap := NewMediaFilesMap()

						tx, err := ws.dbConn.Begin()
						if err != nil {
							return nil, errorsx.Wrap(err)
						}
						defer tx.Rollback()

						for _, hashAsInterface := range hashes {
							hash := domain.HashValue(hashAsInterface.(string))

							mediaFile := ws.mediaFilesDAL.Get(hash).Clone()

							switch mFile := mediaFile.(type) {
							case *domain.PictureMetadata:
								mFile.ParticipantIDs = participantIds
								mediaFilesMap.Pictures = append(mediaFilesMap.Pictures, mFile)
							case *domain.VideoFileMetadata:
								mFile.ParticipantIDs = participantIds
								mediaFilesMap.Videos = append(mediaFilesMap.Videos, mFile)
							case *domain.FitFileSummary:
								mFile.ParticipantIDs = participantIds
								mediaFilesMap.Tracks = append(mediaFilesMap.Tracks, mFile)
							default:
								return nil, errorsx.Errorf("unknown type %T", mFile)
							}

							err = ws.mediaFilesDAL.Update(tx, mediaFile, dal.MediaFileUpdatePropertyParticipantIDs)
							if err != nil {
								return nil, errorsx.Wrap(err)
							}

						}

						commitErr := tx.Commit()
						if commitErr != nil {
							return nil, errorsx.Wrap(commitErr)
						}

						json.NewEncoder(os.Stderr).Encode(mediaFilesMap)
						return mediaFilesMap, nil
					},
				},
			},
		},
	)
}

func (ws *GraphQLAPIService) setupQueryType() *graphql.Object {
	return graphql.NewObject(
		graphql.ObjectConfig{
			Name: "Query",
			Fields: graphql.Fields{
				/* Get track list
					(replace abc with the hash value of your track)
				   http://localhost:9050/api/graphql?query={trackRecords(hashes:[%22abc%22,%20%22def%22]){records{timestamp}}}
				*/
				"tracks": &graphql.Field{
					Type:        tracksType,
					Description: "Get track records",
					Args: graphql.FieldConfigArgument{
						"hashes": &graphql.ArgumentConfig{
							Type: graphql.NewList(graphql.NewNonNull(graphql.String)),
						},
					},
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						hashes, ok := params.Args["hashes"].([]interface{})
						if !ok {
							return nil, errorsx.Errorf("couldn't convert 'hashes' arg to []interface (was %T)", params.Args["hashes"])
						}

						type track struct {
							Hash    domain.HashValue `json:"hash"`
							Records []*domain.Record `json:"records"`
						}

						var tracks []*track

						for _, hashAsInterfaceType := range hashes {
							hash := domain.HashValue(hashAsInterfaceType.(string))
							mediaFile := ws.mediaFilesDAL.Get(hash)

							records, err := ws.tracksDAL.GetRecords(mediaFile.(*domain.FitFileSummary))
							if err != nil {
								return nil, err
							}

							tracks = append(tracks, &track{
								Hash:    hash,
								Records: records,
							})
						}

						return tracks, nil
					},
				},
				"people": &graphql.Field{
					Type:        peopleType,
					Description: "get people",
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						tx, err := ws.dbConn.Begin()
						if err != nil {
							return nil, errorsx.Wrap(err)
						}
						defer tx.Rollback()

						people, err := ws.peopleDAL.GetAllPeople(tx)
						if err != nil {
							return nil, errorsx.Wrap(err)
						}

						return people, nil
					},
				},
				"mediaFiles": &graphql.Field{
					Type:        mediaFilesMapType,
					Description: "get mediafiles",
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						mediaFiles := ws.mediaFilesDAL.GetAll()
						mediaFileMap := NewMediaFilesMap()

						for _, mediaFile := range mediaFiles {
							switch mFile := mediaFile.(type) {
							case *domain.PictureMetadata:
								mediaFileMap.Pictures = append(mediaFileMap.Pictures, mFile)
							case *domain.VideoFileMetadata:
								mediaFileMap.Videos = append(mediaFileMap.Videos, mFile)
							case *domain.FitFileSummary:
								mediaFileMap.Tracks = append(mediaFileMap.Tracks, mFile)
							default:
								info := mFile.GetMediaFileInfo()
								return nil, errorsx.Errorf("unknown mediafile type: %v. Hash: %s, relative path: %q", info.MediaFileType, info.HashValue, info.RelativePath)
							}
						}

						return mediaFileMap, nil
					},
				},
			},
		})
}

type MediaFilesMap struct {
	Pictures []*domain.PictureMetadata   `json:"pictures"`
	Videos   []*domain.VideoFileMetadata `json:"videos"`
	Tracks   []*domain.FitFileSummary    `json:"tracks"`
}

func NewMediaFilesMap() *MediaFilesMap {
	return &MediaFilesMap{
		[]*domain.PictureMetadata{},
		[]*domain.VideoFileMetadata{},
		[]*domain.FitFileSummary{},
	}
}

var (
	tracksType = graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
		Name: "track",
		Fields: graphql.Fields{
			"hash": &graphql.Field{
				Name: "hash",
				Type: graphql.String,
			},
			"records": &graphql.Field{
				Name: "records",
				Type: graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
					Name: "record",
					Fields: graphql.Fields{
						"timestamp": &graphql.Field{
							Type: graphql.DateTime,
						},
						"posLat": &graphql.Field{
							Type: graphql.Float,
						},
						"posLong": &graphql.Field{
							Type: graphql.Float,
						},
						"distance": &graphql.Field{
							Type: graphql.Float,
						},
						"altitude": &graphql.Field{
							Type: graphql.Float,
						},
					},
				})),
			},
		},
	}))
	peopleType = graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
		Name: "person",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				// Name: "id",
				Type: graphql.Int,
			},
			"name": &graphql.Field{
				// Name: "name",
				Type: graphql.String,
			},
		},
	}))
	mediaFileBaseFields = graphql.Fields{
		"relativePath": &graphql.Field{
			Type: graphql.String,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				// resolve embedded media file base fields workaround: https://github.com/graphql-go/graphql/issues/170#issuecomment-325242640
				return (p.Source.(domain.MediaFile)).GetMediaFileInfo().RelativePath, nil
			},
		},
		"hashValue": &graphql.Field{
			Type: graphql.String,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				// resolve embedded media file base fields workaround: https://github.com/graphql-go/graphql/issues/170#issuecomment-325242640
				return (p.Source.(domain.MediaFile)).GetMediaFileInfo().HashValue, nil
			},
		},
		"fileType": &graphql.Field{
			Type: graphql.Int,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				// resolve embedded media file base fields workaround: https://github.com/graphql-go/graphql/issues/170#issuecomment-325242640
				return (p.Source.(domain.MediaFile)).GetMediaFileInfo().MediaFileType, nil
			},
		},
		"fileSizeBytes": &graphql.Field{
			Type: graphql.Int,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				// resolve embedded media file base fields workaround: https://github.com/graphql-go/graphql/issues/170#issuecomment-325242640
				return (p.Source.(domain.MediaFile)).GetMediaFileInfo().FileSizeBytes, nil
			},
		},
		"participantIds": &graphql.Field{
			Type: graphql.NewList(graphql.Int),
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				// resolve embedded media file base fields workaround: https://github.com/graphql-go/graphql/issues/170#issuecomment-325242640
				return (p.Source.(domain.MediaFile)).GetMediaFileInfo().ParticipantIDs, nil
			},
		},
		// "e2e415c51bb22f4d6336bd93a71a6d0815d9effd","fileType":3,"fileSizeBytes":7143,"participantIds":[],"startTime":"2019-03-29T10:36:15Z","endTime":"2019-03-29T10:54:22Z","deviceManufacturer":"Garmin","deviceProduct":"","totalDistance":2896.85,"activityBounds":{"latMin":55.600090781226754,"latMax":55.607599038630724,"longMin":12.98206178471446,"longMax":12.998274313285947}
	}
	picturesType = graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
		Name: "picture",
		Fields: withMediaFileBaseFields(graphql.Fields{
			"rawSize": &graphql.Field{
				Type: graphql.NewObject(graphql.ObjectConfig{
					Name: "rawSize",
					Fields: graphql.Fields{
						"height": &graphql.Field{
							Type: graphql.Int,
						},
						"width": &graphql.Field{
							Type: graphql.Int,
						},
					}}),
			},
			// "exifData": &graphql.Field{
			// 	Type: graphql.
			// },
			"format": &graphql.Field{
				Type: graphql.String,
			},
			"suggestedLocation": &graphql.Field{
				Type: graphql.NewObject(graphql.ObjectConfig{
					Name: "suggestedLocation",
					Fields: graphql.Fields{
						"location": &graphql.Field{
							Type: graphql.NewObject(graphql.ObjectConfig{
								Name: "location",
								Fields: graphql.Fields{
									"lat": &graphql.Field{
										Type: graphql.Float,
									},
									"lon": &graphql.Field{
										Type: graphql.Float,
									},
								},
							}),
						},
						"reason": &graphql.Field{
							Type: graphql.String,
						},
					},
				}),
			},
		}),
	}))

	videosType = graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
		Name:   "video",
		Fields: withMediaFileBaseFields(graphql.Fields{}),
	}))

	tracksSummaryType = graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
		Name:   "trackSummary",
		Fields: withMediaFileBaseFields(graphql.Fields{}),
	}))

	mediaFilesMapType = graphql.NewObject(graphql.ObjectConfig{
		Name: "mediaFileMap",
		Fields: graphql.Fields{
			"pictures": &graphql.Field{
				Type: picturesType,
			},
			"videos": &graphql.Field{
				Type: videosType,
			},
			"tracks": &graphql.Field{
				Type: tracksSummaryType,
			},
		},
	})
)

func withMediaFileBaseFields(fields graphql.Fields) graphql.Fields {
	for k, v := range mediaFileBaseFields {
		fields[k] = v
	}
	return fields
}
