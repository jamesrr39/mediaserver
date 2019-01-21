package profile

import (
	"fmt"
	"io"
	"sync"
	"time"
)

type Run struct {
	startTime time.Time
	profiler  *Profiler
	events    []*event
	runName   string
}

type event struct {
	startTime time.Time
	endTime   time.Time
	eventName string
}

type Profiler struct {
	writer  io.Writer
	nowFunc func() time.Time
	writeMu sync.Mutex
}

func NewProfiler(writer io.Writer) *Profiler {
	return &Profiler{writer, time.Now, sync.Mutex{}}
}

func (profiler *Profiler) NewRun(runName string) *Run {
	return &Run{profiler.nowFunc(), profiler, nil, runName}
}

func (run *Run) Measure(eventName string, action func()) {
	startTime := run.profiler.nowFunc()
	defer func() {
		endTime := run.profiler.nowFunc()
		run.events = append(run.events, &event{startTime, endTime, eventName})
	}()
	action()
}

var timeFormat = "03:04:05.06"

func (run *Run) Record(summaryMessage string) error {
	endTime := run.profiler.nowFunc()
	duration := endTime.Sub(run.startTime)
	eventsText := ""
	for _, recordedEvent := range run.events {
		eventsText += fmt.Sprintf("\t%q: %s (start: %s)\n",
			recordedEvent.eventName,
			recordedEvent.endTime.Sub(recordedEvent.startTime),
			recordedEvent.startTime.Format(timeFormat))
	}

	if summaryMessage != "" {
		summaryMessage += "\n"
	}

	run.profiler.writeMu.Lock()
	defer run.profiler.writeMu.Unlock()
	_, err := fmt.Fprintf(run.profiler.writer, "%s: %q: %s, started at %s\n%s%s",
		run.startTime.Format("2006-01-02"),
		run.runName,
		duration,
		run.startTime.Format(timeFormat),
		summaryMessage,
		eventsText,
	)
	return err
}
