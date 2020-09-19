package webservice

import (
	"encoding/json"
	"fmt"
	"mediaserver/mediaserver/dal"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"mediaserver/mediaserver/domain"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type LoginService struct {
	logger            *logpkg.Logger
	dbConn            *mediaserverdb.DBConn
	peopleDAL         *dal.PeopleDAL
	hmacSigningSecret []byte
	chi.Router
}

func NewLoginService(logger *logpkg.Logger, dbConn *mediaserverdb.DBConn, peopleDAL *dal.PeopleDAL, hmacSigningSecret []byte) *LoginService {
	ws := &LoginService{logger, dbConn, peopleDAL, hmacSigningSecret, chi.NewRouter()}

	ws.Router.Get("/", ws.handlePost)

	return ws
}

type postLoginRequestBody struct {
	Username string `json:"username"`
}

func (ws *LoginService) handlePost(w http.ResponseWriter, r *http.Request) {
	var body postLoginRequestBody
	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusBadRequest)
		return
	}

	tx, err := ws.dbConn.Begin()
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	user, err := ws.peopleDAL.GetPersonByName(tx, body.Username)
	if err != nil {
		if errorsx.Cause(err) == errorsx.ErrItemNotFound {
			errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusUnauthorized)
			return
		}
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	jwtToken, err := domain.CreateJWTToken(ws.hmacSigningSecret, user.ID)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Authorization", fmt.Sprintf("Bearer %s", jwtToken))

	type responseBodyData struct {
		User *domain.Person `json:"user"`
	}
	type responseBody struct {
		Data responseBodyData `json:"data"`
	}

	render.JSON(w, r, responseBody{responseBodyData{user}})
}
