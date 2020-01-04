package dal

import (
	"database/sql"
	"fmt"
	"mediaserver/mediaserver/collections"
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/profile"
)

type CollectionsDAL struct {
}

func NewCollectionsDAL() *CollectionsDAL {
	return &CollectionsDAL{}
}

func (r *CollectionsDAL) GetAll(tx *sql.Tx, profileRun *profile.Run) ([]*collections.Collection, errorsx.Error) {
	measurement := profileRun.Measure("fetch collections")
	defer measurement.Stop()

	collectionDataStep := measurement.MeasureStep("fetch collection data")
	result, err := tx.Query(`
SELECT id(), name FROM collections;
    `)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer result.Close()

	collectionList := []*collections.Collection{}
	for result.Next() {
		var id int64
		var name string
		err = result.Scan(&id, &name)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		collectionList = append(collectionList, &collections.Collection{
			ID:   id,
			Name: name,
		})
	}

	collectionDataStep.Stop()

	collectionsStep := measurement.MeasureStep("fetch hashes for collections")
	for _, collection := range collectionList {
		fetchHashesStep := collectionsStep.MeasureStep(fmt.Sprintf("get picture hashes for collection %d", collection.ID))
		hashes, err := getPictureHashesForCollectionId(tx, collection.ID)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		collection.FileHashes = hashes
		fetchHashesStep.Stop()
	}
	collectionsStep.Stop()

	return collectionList, nil
}

func (r *CollectionsDAL) Get(tx *sql.Tx, collectionID int64) (*collections.Collection, errorsx.Error) {
	row := tx.QueryRow(`
SELECT name FROM collections WHERE id() = $1;
    `, collectionID)
	if row == nil {
		return nil, errorsx.Wrap(ErrNotFound)
	}

	collection := &collections.Collection{
		ID: collectionID,
	}
	err := row.Scan(&collection.Name)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	hashes, err := getPictureHashesForCollectionId(tx, collection.ID)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	collection.FileHashes = hashes

	return collection, nil
}

func (r *CollectionsDAL) Create(tx *sql.Tx, collection *collections.Collection) errorsx.Error {
	if collection.ID != 0 {
		return errorsx.Errorf("expected collection ID to be 0 but was '%d'", collection.ID)
	}

	result, err := tx.Exec(`
INSERT INTO collections(name) VALUES($1);
		`, collection.Name)
	if err != nil {
		return errorsx.Wrap(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return errorsx.Wrap(err)
	}

	collection.ID = id

	err = setFileHashesForCollection(tx, collection)
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}

func (r *CollectionsDAL) Update(tx *sql.Tx, collection *collections.Collection) errorsx.Error {
	if collection.ID == 0 {
		return errorsx.Errorf("expected collection ID to be not 0 but was 0")
	}

	result, err := tx.Exec(`
UPDATE collections SET name = $1 WHERE id() = $2;
		`, collection.Name, collection.ID)
	if err != nil {
		return errorsx.Wrap(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errorsx.Wrap(err)
	}
	if rowsAffected == 0 {
		return errorsx.Errorf("expected rows to be affected by name update but they were not")
	}

	err = setFileHashesForCollection(tx, collection)
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}

func (r *CollectionsDAL) Delete(tx *sql.Tx, collectionID int64) errorsx.Error {
	if collectionID == 0 {
		return errorsx.Errorf("expected collection ID to be not 0 but was 0")
	}

	result, err := tx.Exec(`
DELETE FROM collections WHERE id() = $1;
		`, collectionID)
	if err != nil {
		return errorsx.Wrap(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errorsx.Wrap(err)
	}
	if rowsAffected == 0 {
		return errorsx.Errorf("expected rows to be affected by name update but they were not")
	}

	_, err = tx.Exec(`
		DELETE FROM join_pictures_hash_collections WHERE collection_id = $1;
		`, collectionID)
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}

func hashesToMap(hashes []domain.HashValue) map[domain.HashValue]bool {
	hashInCollectionMap := make(map[domain.HashValue]bool)
	for _, hash := range hashes {
		hashInCollectionMap[hash] = true
	}
	return hashInCollectionMap
}

func setFileHashesForCollection(tx *sql.Tx, collection *collections.Collection) error {
	hashInCollectionMap := hashesToMap(collection.FileHashes)

	// get hashes for collection already in db
	hashesInDB, err := getPictureHashesForCollectionId(tx, collection.ID)
	if err != nil {
		return errorsx.Wrap(err)
	}

	hashInDBMap := hashesToMap(hashesInDB)

	var hashesToInsert []domain.HashValue
	var hashesToDelete []domain.HashValue

	// figure out which to delete (in DB, not in collection)
	for _, hashInDB := range hashesInDB {
		isInCollection := hashInCollectionMap[hashInDB]
		if !isInCollection {
			hashesToDelete = append(hashesToDelete, hashInDB)
		}
	}

	// figure out which to insert (in collection, not in DB)
	for _, hashInCollection := range collection.FileHashes {
		isInDB := hashInDBMap[hashInCollection]
		if !isInDB {
			hashesToInsert = append(hashesToInsert, hashInCollection)
		}
	}

	for _, hashToDelete := range hashesToDelete {
		_, err = tx.Exec(`
DELETE FROM join_pictures_hash_collections WHERE collection_id = $1 AND picture_hash = $2;
		`, collection.ID, hashToDelete)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}

	for _, hashToInsert := range hashesToInsert {
		_, err = tx.Exec(`
INSERT INTO join_pictures_hash_collections(collection_id, picture_hash)
VALUES($1, $2);
		`, collection.ID, hashToInsert)
		if err != nil {
			return errorsx.Wrap(err)
		}
	}

	return nil
}

func getPictureHashesForCollectionId(tx *sql.Tx, collectionID int64) ([]domain.HashValue, error) {
	result, err := tx.Query(`
SELECT picture_hash FROM join_pictures_hash_collections WHERE collection_id = $1;
    `, collectionID)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer result.Close()

	if result.Err() != nil {
		return nil, errorsx.Wrap(err)
	}

	var hashes []domain.HashValue
	for result.Next() {
		var hash domain.HashValue
		err = result.Scan(&hash)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		hashes = append(hashes, hash)
	}

	return hashes, errorsx.Wrap(err)
}
