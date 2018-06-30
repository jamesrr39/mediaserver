package must

import (
	"fmt"
)

// Must panics on error
func Must(err error) {
	if nil != err {
		panic(err)
	}
}

func Mustf(err error, format string, args ...interface{}) {
	if nil != err {
		panic(fmt.Sprintf(format, args) + "\nOriginal Error: " + err.Error())
	}
}
