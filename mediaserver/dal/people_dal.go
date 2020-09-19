package dal

import (
	"database/sql"
	"mediaserver/mediaserver/domain"

	"github.com/jamesrr39/goutil/errorsx"
)

type PeopleDAL struct {
}

func NewPeopleDAL() *PeopleDAL {
	return &PeopleDAL{}
}

func (r *PeopleDAL) CreatePerson(tx *sql.Tx, person *domain.Person) errorsx.Error {
	result, err := tx.Exec(`INSERT INTO people (name) VALUES ($1);`, person.Name)
	if err != nil {
		return errorsx.Wrap(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return errorsx.Wrap(err)
	}

	person.ID = id
	return nil
}

func (r *PeopleDAL) GetPeopleByIDs(tx *sql.Tx, ids []int64) ([]*domain.Person, errorsx.Error) {
	rows, err := tx.Query("SELECT id(), name, is_user FROM people WHERE id() IN ($1)", ids)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer rows.Close()

	var people []*domain.Person
	for rows.Next() {
		person := new(domain.Person)
		err := rows.Scan(&person.ID, &person.Name, &person.IsUser)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		people = append(people, person)
	}

	if rows.Err() != nil {
		return nil, errorsx.Wrap(rows.Err())
	}

	return people, nil
}

func (r *PeopleDAL) GetAllPeople(tx *sql.Tx) ([]*domain.Person, errorsx.Error) {
	rows, err := tx.Query("SELECT id(), name, is_user FROM people")
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer rows.Close()

	people := []*domain.Person{}
	for rows.Next() {
		person := new(domain.Person)
		err := rows.Scan(&person.ID, &person.Name, &person.IsUser)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		people = append(people, person)
	}

	if rows.Err() != nil {
		return nil, errorsx.Wrap(rows.Err())
	}

	return people, nil
}

func (r *PeopleDAL) GetPeopleIDsInMediaFile(tx *sql.Tx, mediaFileHash domain.HashValue) ([]int64, errorsx.Error) {
	rows, err := tx.Query("SELECT person_id FROM people_mediafiles WHERE mediafile_hash = $1", mediaFileHash)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	defer rows.Close()

	personIDs := []int64{}
	for rows.Next() {
		var personID int64
		err := rows.Scan(&personID)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}

		personIDs = append(personIDs, personID)
	}

	if rows.Err() != nil {
		return nil, errorsx.Wrap(rows.Err())
	}

	return personIDs, nil
}

func (r *PeopleDAL) GetPersonByName(tx *sql.Tx, name string) (*domain.Person, errorsx.Error) {
	row := tx.QueryRow("SELECT id(), name, is_user FROM people WHERE name = $1", name)
	if row == nil {
		return nil, errorsx.Wrap(errorsx.ErrItemNotFound)
	}

	person := new(domain.Person)
	err := row.Scan(&person.ID, &person.Name, &person.IsUser)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return person, nil
}
