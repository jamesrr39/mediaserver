package mediaserverdb

import (
	"database/sql"
	"fmt"
	"io"
	"log"

	ql "github.com/cznic/ql" // register driver
)

type db interface {
	Begin() (*sql.Tx, error)
	io.Closer
}

type DBConn struct {
	db
	logger Logger
}

func init() {
	ql.RegisterDriver()
}

type Logger interface {
	Printlnf(message string, args ...interface{})
}

func NewDBConn(dbPath string, logger Logger) (*DBConn, error) {
	logger.Printlnf("opening ql db at '%s'", dbPath)
	db, err := sql.Open("ql", dbPath)
	if nil != err {
		return nil, err
	}

	dbConn := &DBConn{db, logger}

	err = dbConn.runChangescripts()
	if nil != err {
		return nil, err
	}

	return dbConn, nil
}

func (dbConn *DBConn) runChangescripts() error {
	tx, err := dbConn.Begin()
	if nil != err {
		return err
	}

	_, err = tx.Exec(createDBSQL)
	if nil != err {
		return err
	}

	version, err := dbConn.getCurrentVersion(tx)
	if nil != err {
		return err
	}

	appSchemaVersion := len(changescripts)
	if appSchemaVersion < version {
		return fmt.Errorf("app schema version is older than the database schema version. App schema version: %d, database schema version: %d",
			appSchemaVersion,
			version)
	}

	if version == 0 {
		_, err = tx.Exec("INSERT INTO db_state (version) VALUES (0)")
		if nil != err {
			return err
		}
	}

	dbConn.logger.Printlnf("starting to apply changescripts. Current version: %d", version)
	for ; version < appSchemaVersion; version++ {
		changescript := changescripts[version]
		dbConn.logger.Printlnf("applying changescript %d: '%s'", version, changescript)
		_, err = tx.Exec(changescript)
		if nil != err {
			return fmt.Errorf("errors applying db version %d. Error: '%s'. Changescript: '%s'", version, err, changescript)
		}
	}
	dbConn.logger.Printlnf("updating db version to %d", version)
	_, err = tx.Exec("UPDATE db_state SET version = $1", version)
	if nil != err {
		return err
	}

	err = tx.Commit()
	if nil != err {
		return err
	}

	return nil
}

func (dbConn *DBConn) getCurrentVersion(tx *sql.Tx) (int, error) {

	row := tx.QueryRow("SELECT version FROM db_state")

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
