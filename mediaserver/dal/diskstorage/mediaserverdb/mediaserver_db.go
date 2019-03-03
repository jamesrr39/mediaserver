package mediaserverdb

import (
	"database/sql"
	"io"
	"log"

	ql "github.com/cznic/ql" // register driver
	"github.com/jamesrr39/goutil/dbstatetracker"
	"github.com/jamesrr39/goutil/logger"

	"github.com/jamesrr39/goutil/errorsx"
)

type db interface {
	Begin() (*sql.Tx, error)
	io.Closer
}

type DBConn struct {
	db
	logger logger.Logger
}

func init() {
	ql.RegisterDriver()
}

func NewDBConn(dbPath string, logger logger.Logger) (*DBConn, error) {
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

func (dbConn *DBConn) runChangescripts() error {
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
