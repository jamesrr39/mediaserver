package errorsx

import (
	"fmt"
	"runtime/debug"
)

type kvPairsMapType map[interface{}]interface{}

type Error interface {
	Error() string
	Stack() []byte
}

type Err struct {
	error
	kvPairs kvPairsMapType
	stack   []byte
}

func (err *Err) Stack() []byte {
	return err.stack
}

func Errorf(message string, args ...interface{}) Error {
	return &Err{
		fmt.Errorf(message, args...),
		make(kvPairsMapType),
		debug.Stack(),
	}
}

func Wrap(err error, kvPairs ...interface{}) Error {
	if err == nil {
		return nil
	}

	kvPairsMap := make(kvPairsMapType)
	for i := 0; i < len(kvPairs); i = i + 2 {
		k := kvPairs[i]
		v := kvPairs[i+1]
		kvPairsMap[k] = v
	}

	return &Err{
		err,
		kvPairsMap,
		debug.Stack(),
	}
}

// Cause fetches the underlying cause of the error
// this should be used with errors wrapped from errors.New()
func Cause(err error) error {
	errErr, ok := err.(*Err)
	if ok {
		return Cause(errErr.error)
	}

	return err
}
