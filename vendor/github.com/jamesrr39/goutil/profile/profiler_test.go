package profile

import (
	"bytes"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_Profiler(t *testing.T) {
	timeIncrement := int64(0)
	byteBuffer := bytes.NewBuffer(nil)
	profiler := Profiler{
		byteBuffer,
		func() time.Time { timeIncrement++; return time.Unix(0, timeIncrement*2000) },
		sync.Mutex{},
	}

	testRun := profiler.NewRun("add ints and strings")
	defer func() {
		testRun.Record("finished successfully")
		expected := `1970-01-01: "add ints and strings": 10µs, started at 01:00:00.70
finished successfully
	"adding 1 and 2": 2µs (start: 01:00:00.70)
	"building a string": 2µs (start: 01:00:00.70)
`
		assert.Equal(t, expected, byteBuffer.String())
	}()

	discarder := bytes.NewBuffer(nil)

	testRun.Measure("adding 1 and 2", func() {
		discarder.Write([]byte(fmt.Sprintf("%d", 1+2)))
	})

	testRun.Measure("building a string", func() {
		discarder.Write([]byte("a + b"))
	})

}
