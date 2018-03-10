package testutil

import (
	"fmt"
	"mediaserverapp/mediaserver/picturesdal/diskstorage/mediaserverdb"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

var currentDbID int32

func NewTestDB(t *testing.T) *mediaserverdb.DBConn {
	dbID := atomic.AddInt32(&currentDbID, 1)
	dbConn, err := mediaserverdb.NewDBConn(fmt.Sprintf("memory://testdb_%d", dbID))
	require.Nil(t, err)

	return dbConn
}
