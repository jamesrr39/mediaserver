package dbstatetracker

import (
	"database/sql"
	"fmt"
)

type LogFunc func(message string, args ...interface{})

// DBStateTracker is a tool that keeps track of your database.
// It is used to keep a database up to date, given a list of changescripts.
type DBStateTracker struct {
	CreateVersionTableIfNotExistsSQL string // CREATE TABLE IF NOT EXISTS db_state (version int);
	GetVersionSQL                    string // SELECT version FROM db_state
	InsertFirstVersionSQL            string // INSERT INTO db_state (version) VALUES (0)
	UpdateVersionSQL                 string // UPDATE db_state SET version = $1
	LogFunc                          LogFunc
}

func (t *DBStateTracker) GetCurrentVersion(tx *sql.Tx) (int, error) {
	row := tx.QueryRow(t.GetVersionSQL)

	var version int
	err := row.Scan(&version)
	if nil != err {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, err
	}

	return version, nil
}

func (t *DBStateTracker) RunChangescripts(tx *sql.Tx, changescripts []string) error {
	_, err := tx.Exec(t.CreateVersionTableIfNotExistsSQL)
	if nil != err {
		return err
	}

	version, err := t.GetCurrentVersion(tx)
	if nil != err {
		return err
	}

	appSchemaVersion := len(changescripts)
	if appSchemaVersion < version {
		return fmt.Errorf("app schema version (%d) is older than the database schema version (%d)",
			appSchemaVersion,
			version)
	}

	if version == 0 {
		_, err = tx.Exec(t.InsertFirstVersionSQL)
		if nil != err {
			return err
		}
	}

	t.LogFunc("starting to apply changescripts. Current version: %d", version)
	for ; version < appSchemaVersion; version++ {
		changescript := changescripts[version]
		t.LogFunc("applying changescript %d: '%s'", version, changescript)
		_, err = tx.Exec(changescript)
		if nil != err {
			return fmt.Errorf("errors applying db version %d. Error: '%s'. Changescript: '%s'", version, err, changescript)
		}
	}
	t.LogFunc("updating db version to %d", version)
	_, err = tx.Exec(t.UpdateVersionSQL, version)
	if nil != err {
		return err
	}

	return nil

}
