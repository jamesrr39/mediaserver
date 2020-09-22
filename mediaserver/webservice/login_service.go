package webservice

import (
	"encoding/json"
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

	ws.Router.Get("/users/", ws.handleGetUsers)
	ws.Router.Post("/users/", ws.handleCreateUser)
	ws.Router.Post("/", ws.handlePost)

	return ws
}

func (ws *LoginService) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	tx, err := ws.dbConn.Begin()
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	people, err := ws.peopleDAL.GetAllPeople(tx)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	type responseBodyData struct {
		People []*domain.Person `json:"people"`
	}

	render.JSON(w, r, responseBody{responseBodyData{people}})
}

func (ws *LoginService) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	type postLoginRequestBody struct {
		Username string `json:"username"`
	}
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

	user := domain.NewPerson(0, body.Username, true)

	err = ws.peopleDAL.CreatePerson(tx, user)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	err = ws.loginUser(w, r, user)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
}

func (ws *LoginService) handlePost(w http.ResponseWriter, r *http.Request) {
	type postLoginRequestBody struct {
		UserID int64 `json:"userId"`
	}
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

	user, err := ws.peopleDAL.GetPersonByID(tx, body.UserID)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	err = ws.loginUser(w, r, user)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}
}
func (ws *LoginService) loginUser(w http.ResponseWriter, r *http.Request, user *domain.Person) errorsx.Error {
	jwtToken, err := domain.CreateJWTToken(ws.hmacSigningSecret, user.ID)
	if err != nil {
		return errorsx.Wrap(err)
	}

	type responseBodyData struct {
		User  *domain.Person `json:"user"`
		Token string         `json:"token"`
	}

	render.JSON(w, r, responseBody{responseBodyData{user, jwtToken}})

	return nil
}
