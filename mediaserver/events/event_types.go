package events

import (
	"fmt"

	"github.com/jamesrr39/goutil/errorsx"
)

type EventJobStarted struct {
	JobName string
}

func (ejs EventJobStarted) Name() string {
	return fmt.Sprintf("job.started.%s", ejs.JobName)
}

type EventJobSuccessful struct {
	JobName string
}

func (ejs EventJobSuccessful) Name() string {
	return fmt.Sprintf("job.successful.%s", ejs.JobName)
}

type EventJobFailed struct {
	JobName string
	Err     errorsx.Error
}

func (ejs EventJobFailed) Name() string {
	return fmt.Sprintf("job.failed.%s", ejs.JobName)
}
