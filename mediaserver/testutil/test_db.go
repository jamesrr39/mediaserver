package testutil

import (
	"fmt"
	"io/ioutil"
	"mediaserverapp/mediaserver/dal/diskstorage/mediaserverdb"
	"sync/atomic"
	"testing"

	"github.com/jamesrr39/goutil/logger"
	"github.com/stretchr/testify/require"
)

var currentDbID int32

type TestDB struct {
	*mediaserverdb.DBConn
	Logger *logger.Logger
}

func NewTestDB(t *testing.T) *TestDB {
	dbID := atomic.AddInt32(&currentDbID, 1)

	dbLogger := logger.NewLogger(ioutil.Discard, logger.LogLevelInfo)

	dbConn, err := mediaserverdb.NewDBConn(fmt.Sprintf("memory://testdb_%d", dbID), dbLogger)
	require.Nil(t, err)

	return &TestDB{dbConn, dbLogger}
}
