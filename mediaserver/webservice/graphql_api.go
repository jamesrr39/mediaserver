package webservice

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mediaserver/mediaserver/domain"
	"net/http"
	"strings"

	"github.com/go-chi/chi"
	"github.com/graphql-go/graphql"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type GraphQLAPIService struct {
	logger        *logpkg.Logger
	schema        *graphql.Schema
	tracksDAL     tracksDALInterface
	mediaFilesDAL mediaFilesDALInterface
	chi.Router
}

type tracksDALInterface interface {
	GetRecords(mediaFile *domain.FitFileSummary) (domain.Records, errorsx.Error)
}

type mediaFilesDALInterface interface {
	Get(hash domain.HashValue) domain.MediaFile
}

func NewGraphQLAPIService(logger *logpkg.Logger, tracksDAL tracksDALInterface, mediaFilesDAL mediaFilesDALInterface) (*GraphQLAPIService, errorsx.Error) {
	router := chi.NewRouter()
	ws := &GraphQLAPIService{logger, nil, tracksDAL, mediaFilesDAL, router}

	var schema, err = graphql.NewSchema(
		graphql.SchemaConfig{
			Query: ws.setupQueryType(),
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

func (ws *GraphQLAPIService) setupQueryType() *graphql.Object {
	return graphql.NewObject(
		graphql.ObjectConfig{
			Name: "Query",
			Fields: graphql.Fields{
				/* Get track list
					(replace abc with the hash value of your track)
				   http://localhost:9050/api/graphql?query={tracks(hashes:[%22abc%22,%20%22def%22]){records{timestamp}}}
				*/
				"tracks": &graphql.Field{
					Type: graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
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
					})),
					Description: "Get tracks",
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
			},
		})
}
