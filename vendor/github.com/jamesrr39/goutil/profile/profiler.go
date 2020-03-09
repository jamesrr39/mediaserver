package profile

import (
	"io"
	"sync"
	"time"

	"github.com/gogo/protobuf/proto"
	"github.com/jamesrr39/goutil/errorsx"
)

type Profiler struct {
	writer  io.Writer
	nowFunc func() time.Time
	writeMu sync.Mutex
}

func NewProfiler(writer io.Writer) *Profiler {
	return &Profiler{writer, time.Now, sync.Mutex{}}
}

func (profiler *Profiler) NewRun(runName string) *Run {
	return &Run{
		Name:           runName,
		StartTimeNanos: profiler.nowFunc().UnixNano(),
		Events:         []*Event{},
	}
}

func (profiler *Profiler) Mark(run *Run, eventName string) {
	now := profiler.nowFunc()
	run.Events = append(run.Events, &Event{
		Name:      eventName,
		TimeNanos: now.UnixNano(),
	})
}

func (profiler *Profiler) StopAndRecord(run *Run, summaryMessage string) errorsx.Error {
	endTime := profiler.nowFunc()

	run.EndTimeNanos = endTime.UnixNano()
	run.Summary = summaryMessage

	b, err := proto.Marshal(run)
	if err != nil {
		return errorsx.Wrap(err)
	}

	profiler.writeMu.Lock()
	defer profiler.writeMu.Unlock()

	_, err = profiler.writer.Write(b)
	if err != nil {
		return errorsx.Wrap(err)
	}

	return nil
}
