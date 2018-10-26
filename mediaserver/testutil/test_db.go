package testutil

import (
	"fmt"
	"mediaserverapp/mediaserver/dal/diskstorage/mediaserverdb"
	"sync/atomic"
	"testing"

	"github.com/jamesrr39/goutil/logger"

	"github.com/stretchr/testify/require"
)

var currentDbID int32

func NewTestDB(t *testing.T) *mediaserverdb.DBConn {
	dbID := atomic.AddInt32(&currentDbID, 1)
	dbConn, err := mediaserverdb.NewDBConn(fmt.Sprintf("memory://testdb_%d", dbID), logger.Logger{})
	require.Nil(t, err)

	return dbConn
}
