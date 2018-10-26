package pictureswebservice

import (
	"encoding/json"
	"fmt"
	"mediaserverapp/mediaserver/collections"
	"mediaserverapp/mediaserver/domain"
	"mediaserverapp/mediaserver/picturesdal/diskstorage"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"net/http"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
)

type CollectionsWebService struct {
	collectionsRepository *diskstorage.CollectionsRepository
	dbConn                *mediaserverdb.DBConn
	chi.Router
}

func NewCollectionsWebService(
	dbConn *mediaserverdb.DBConn,
	collectionsRepository *diskstorage.CollectionsRepository,
) *CollectionsWebService {
	router := chi.NewRouter()

	ws := &CollectionsWebService{collectionsRepository, dbConn, router}

	router.Get("/", ws.handleGetAll)
	router.Post("/", ws.handleCreate)
	router.Put("/{id}", ws.handleUpdate)
	router.Delete("/{id}", ws.handleDelete)
	return ws
}

func (ws *CollectionsWebService) handleGetAll(w http.ResponseWriter, r *http.Request) {
	tx, err := ws.dbConn.Begin()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer tx.Rollback()

	collectionList, err := ws.collectionsRepository.GetAll(tx)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	if len(collectionList) == 0 {
		collectionList = []*collections.Collection{}
	}

	for _, collection := range collectionList {
		if len(collection.FileHashes) == 0 {
			collection.FileHashes = []domain.HashValue{}
		}
	}

	render.JSON(w, r, collectionList)
}

func (ws *CollectionsWebService) handleCreate(w http.ResponseWriter, r *http.Request) {
	var collection *collections.Collection
	err := json.NewDecoder(r.Body).Decode(&collection)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	err = collection.IsValid()
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	tx, err := ws.dbConn.Begin()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ws.collectionsRepository.Create(tx, collection)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	if len(collection.FileHashes) == 0 {
		collection.FileHashes = []domain.HashValue{}
	}

	render.JSON(w, r, collection)
}

func (ws *CollectionsWebService) handleUpdate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var collection *collections.Collection
	err := json.NewDecoder(r.Body).Decode(&collection)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	err = collection.IsValid()
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	if id != strconv.FormatInt(collection.ID, 10) {
		http.Error(w, fmt.Sprintf("bad match on IDs: got '%s' from URL param but '%d' from request body", id, collection.ID), 400)
		return
	}

	tx, err := ws.dbConn.Begin()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ws.collectionsRepository.Update(tx, collection)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	if len(collection.FileHashes) == 0 {
		collection.FileHashes = []domain.HashValue{}
	}

	render.JSON(w, r, collection)
}

func (ws *CollectionsWebService) handleDelete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	tx, err := ws.dbConn.Begin()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer mediaserverdb.CommitOrRollback(tx)

	err = ws.collectionsRepository.Delete(tx, id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	render.NoContent(w, r)
}
