package domain

func NewPerson(id int64, name string, isUser bool) *Person {
	return &Person{id, name, isUser}
}

type Person struct {
	ID     int64  `json:"id"`
	Name   string `json:"name"`
	IsUser bool   `json:"isUser"`
}
