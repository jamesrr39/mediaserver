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
}

func init() {
	ql.RegisterDriver()
}

func NewDBConn(dbPath string) (*DBConn, error) {
	log.Printf("opening ql db at '%s'\n", dbPath)
	db, err := sql.Open("ql", dbPath)
	if nil != err {
		return nil, err
	}

	dbConn := &DBConn{db}

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

	log.Println("getting db version")

	version, err := dbConn.getCurrentVersion(tx)
	if nil != err {
		return err
	}

	if version == 0 {
		_, err = tx.Exec("INSERT INTO db_state (version) VALUES (0)")
		if nil != err {
			return err
		}
	}

	log.Printf("starting to apply changescripts. Current version: %d\n", version)
	for ; version < len(changescripts); version++ {
		changescript := changescripts[version]
		log.Printf("applying changescript %d: '%s'\n", version, changescript)
		_, err = tx.Exec(changescript)
		if nil != err {
			return fmt.Errorf("errors applying db version %d. Error: '%s'. Changescript: '%s'", version, err, changescript)
		}
	}
	log.Printf("updating db version to %d\n", version)
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
		log.Printf("error getting version: %s\n", err)
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
