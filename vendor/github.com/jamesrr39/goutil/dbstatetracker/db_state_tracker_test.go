package dbstatetracker

import (
	"database/sql"
	"testing"

	"github.com/cznic/ql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	ql.RegisterMemDriver()
}

func discardLogFunc(message string, args ...interface{}) {}

var changescripts = []string{`
  CREATE TABLE people (
    name string
  );
  `, `
  INSERT INTO people(name) VALUES("test user")
  `}

func Test_QlDB(t *testing.T) {
	tracker := NewDBStateTrackerForQLDB(discardLogFunc)
	db, err := sql.Open("ql-mem", "test")
	require.Nil(t, err)

	tx, err := db.Begin()
	require.Nil(t, err)

	err = tracker.RunChangescripts(tx, changescripts)
	require.Nil(t, err)

	version, err := tracker.GetCurrentVersion(tx)
	require.Nil(t, err)
	assert.Equal(t, len(changescripts), version)

	changescripts2 := []string{"", ""}

	copy(changescripts2, changescripts)

	changescripts2 = append(changescripts2, `INSERT INTO people(name) VALUES("test user 2")`)

	err = tracker.RunChangescripts(tx, changescripts2)
	require.Nil(t, err)

	version, err = tracker.GetCurrentVersion(tx)
	require.Nil(t, err)
	assert.Equal(t, len(changescripts2), version)
}
