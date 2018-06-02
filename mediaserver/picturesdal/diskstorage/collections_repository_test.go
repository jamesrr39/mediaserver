package diskstorage

import (
	"mediaserverapp/mediaserver/collections"
	"mediaserverapp/mediaserver/pictures"
	"mediaserverapp/mediaserver/testutil"
	"testing"

	"github.com/alecthomas/assert"
	"github.com/stretchr/testify/require"
)

func Test_CrudCollection(t *testing.T) {
	dbConn := testutil.NewTestDB(t)
	defer dbConn.Close()

	tx, err := dbConn.Begin()
	require.Nil(t, err)
	defer tx.Rollback()

	collectionsRepo := NewCollectionsRepository()
	collection1 := &collections.Collection{
		Name: "test 1",
	}
	collection2 := &collections.Collection{
		Name:       "test 2",
		FileHashes: []pictures.HashValue{"hash1", "hash2"},
	}

	t.Run("test create", func(t *testing.T) {
		err = collectionsRepo.Create(tx, collection1)
		require.Nil(t, err)
		err = collectionsRepo.Create(tx, collection2)
		require.Nil(t, err)

		collectionList, err := collectionsRepo.GetAll(tx)
		require.Nil(t, err)

		assert.Len(t, collectionList, 2)
		for _, collection := range collectionList {
			switch collection.Name {
			case collection1.Name:
				assert.Equal(t, collection1, collection)
			case collection2.Name:
				assert.Equal(t, collection2.Name, collection.Name)
				assert.Len(t, collection.FileHashes, 2)
				assert.Contains(t, collection.FileHashes, collection2.FileHashes[0])
				assert.Contains(t, collection.FileHashes, collection2.FileHashes[1])
			default:
				t.Errorf("unexpected collection name: '%s'", collection.Name)
			}
		}
	})

	changedCollection2 := &collections.Collection{
		ID:         collection2.ID,
		Name:       "updated name",
		FileHashes: []pictures.HashValue{"hash 3"},
	}
	t.Run("test update", func(t *testing.T) {
		err := collectionsRepo.Update(tx, changedCollection2)
		require.Nil(t, err)

		updatedCollection2, err := collectionsRepo.Get(tx, changedCollection2.ID)
		require.Nil(t, err)

		assert.Equal(t, changedCollection2, updatedCollection2)
	})

	t.Run("test delete", func(t *testing.T) {
		err = collectionsRepo.Delete(tx, changedCollection2.ID)
		require.Nil(t, err)

		collectionList, err := collectionsRepo.GetAll(tx)
		require.Nil(t, err)

		assert.Equal(t, collectionList, []*collections.Collection{collection1})
	})
}
