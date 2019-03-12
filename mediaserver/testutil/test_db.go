package testutil

import (
	"fmt"
	"io/ioutil"
	"mediaserver/mediaserver/dal/diskstorage/mediaserverdb"
	"sync/atomic"
	"testing"

	"github.com/jamesrr39/goutil/logpkg"
	"github.com/stretchr/testify/require"
)

var currentDbID int32

type TestDB struct {
	*mediaserverdb.DBConn
	Logger *logpkg.Logger
}

func NewTestDB(t *testing.T) *TestDB {
	dbID := atomic.AddInt32(&currentDbID, 1)

	dbLogger := logpkg.NewLogger(ioutil.Discard, logpkg.LogLevelInfo)

	dbConn, err := mediaserverdb.NewDBConn(fmt.Sprintf("memory://testdb_%d", dbID), dbLogger)
	require.Nil(t, err)

	return &TestDB{dbConn, dbLogger}
}
