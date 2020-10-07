package mediaserverdb

import (
	"database/sql"
	"log"

	"github.com/jamesrr39/goutil/dbstatetracker"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	ql "modernc.org/ql" // register driver
)

type DBConn struct {
	backingDB *sql.DB
	logger    *logpkg.Logger
}

func (dbc *DBConn) Begin() (*sql.Tx, errorsx.Error) {
	tx, err := dbc.backingDB.Begin()
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return tx, nil
}

func (dbc *DBConn) Close() error {
	return dbc.backingDB.Close()
}

func init() {
	ql.RegisterDriver()
}

func NewDBConn(dbPath string, logger *logpkg.Logger) (*DBConn, error) {
	logger.Info("opening ql db at '%s'", dbPath)
	db, err := sql.Open("ql", dbPath)
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	dbConn := &DBConn{db, logger}

	err = dbConn.runChangescripts()
	if nil != err {
		return nil, errorsx.Wrap(err)
	}

	return dbConn, nil
}

func (dbConn *DBConn) runChangescripts() errorsx.Error {
	var err error
	tx, err := dbConn.Begin()
	if nil != err {
		return errorsx.Wrap(err)
	}

	tracker := dbstatetracker.NewDBStateTrackerForQLDB(dbConn.logger.Info)
	err = tracker.RunChangescripts(tx, changescripts)
	if nil != err {
		return errorsx.Wrap(err)
	}

	err = tx.Commit()
	if nil != err {
		return errorsx.Wrap(err)
	}

	return nil
}

func CommitOrRollback(tx *sql.Tx) {
	err := tx.Commit()
	if nil != err {
		log.Printf("ERROR: unable to commit transaction, rolling back. Error: '%s'\n", err)

		err = tx.Rollback()
		if nil != err {
			log.Printf("ERROR: unable to rollback transaction after failing to commit. Error: '%s'\n", err)
		}
	}
}

func Rollback(tx *sql.Tx) {
	err := tx.Rollback()
	if nil != err {
		log.Printf("ERROR: unable to rollback transaction. Error: '%s'\n", err)
	}
}
