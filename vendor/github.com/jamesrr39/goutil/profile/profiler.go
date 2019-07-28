package profile

import (
	"fmt"
	"io"
	"sync"
	"time"
)

type Run struct {
	startTime    time.Time
	profiler     *Profiler
	measurements []*measurement
	runName      string
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

// func (run *Run) Measure(eventName string, action func()) {
// 	startTime := run.profiler.nowFunc()
// 	defer func() {
// 		endTime := run.profiler.nowFunc()
// 		run.events = append(run.events, &event{startTime, endTime, eventName})
// 	}()
// 	action()
// }

type measurement struct {
	profileRun      *Run
	startTime       time.Time
	endTime         *time.Time
	eventName       string
	subMeasurements []*measurement
}

func (m *measurement) Stop() {
	endTime := m.profileRun.profiler.nowFunc()
	m.endTime = &endTime
}

func (m *measurement) Record(levelOfIndent int) string {
	var tabsText string
	for i := 0; i < levelOfIndent; i++ {
		tabsText += "\t"
	}

	duration := "(unknown duration)"
	if m.endTime != nil {
		duration = m.endTime.Sub(m.startTime).String()
	}

	text := fmt.Sprintf("%s%q: %s (start: %s)\n",
		tabsText,
		m.eventName,
		duration,
		m.startTime.Format(timeFormat))

	if len(m.subMeasurements) != 0 {
		for _, subMeasurement := range m.subMeasurements {
			text += subMeasurement.Record(levelOfIndent + 1)
		}
	}

	return text
}

func (run *Run) Measure(eventName string) *measurement {
	m := &measurement{
		profileRun: run,
		startTime:  run.profiler.nowFunc(),
		eventName:  eventName,
	}
	m.profileRun.measurements = append(m.profileRun.measurements, m)
	return m
}

func (m *measurement) MeasureStep(eventName string) *measurement {
	subMeasurement := &measurement{
		profileRun: m.profileRun,
		startTime:  m.profileRun.profiler.nowFunc(),
		eventName:  eventName,
	}

	m.subMeasurements = append(m.subMeasurements, subMeasurement)
	return subMeasurement
}

var timeFormat = "03:04:05.06"

func (run *Run) StopAndRecord(summaryMessage string) error {
	endTime := run.profiler.nowFunc()
	duration := endTime.Sub(run.startTime)
	eventsText := ""
	for _, m := range run.measurements {
		eventsText += m.Record(1)
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
