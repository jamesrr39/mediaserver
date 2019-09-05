package domain

import (
	"bytes"
	"encoding/gob"
)

func gobClone(from, to interface{}) {
	bb := bytes.NewBuffer(nil)
	err := gob.NewEncoder(bb).Encode(from)
	if err != nil {
		panic(err)
	}

	err = gob.NewDecoder(bb).Decode(to)
	if err != nil {
		panic(err)
	}
}
