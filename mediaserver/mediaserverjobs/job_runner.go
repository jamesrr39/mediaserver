package mediaserverjobs

import (
	"fmt"
	"mediaserver/mediaserver/events"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/semaphore"
)

type JobType int

const (
	JobTypeUnknown JobType = iota
	JobTypeCPUJob
)

type Job interface {
	run() errorsx.Error
	fmt.Stringer
	Name() string
	JobType() JobType
}

type JobRunner struct {
	logger      *logpkg.Logger
	cpuJobsSema *semaphore.Semaphore
	eventBus    *events.EventBus
}

func NewJobRunner(logger *logpkg.Logger, maxConcurrentJobs uint, eventBus *events.EventBus) *JobRunner {
	cpuJobsSema := semaphore.NewSemaphore(maxConcurrentJobs)
	return &JobRunner{logger, cpuJobsSema, eventBus}
}

func (j *JobRunner) QueueJob(job Job, onSuccessful func()) {
	j.logger.Info("JOB: running job: %q", job)
	j.eventBus.SendEvent(events.EventJobStarted{JobName: job.Name()})

	switch job.JobType() {
	case JobTypeCPUJob:
		j.cpuJobsSema.Add()
		go func() {
			defer j.cpuJobsSema.Done()

			err := job.run()
			if err != nil {
				j.logger.Error("JOB: error running job %q. Error: %q. Stack:\n%s", job, err, err.Stack())
				j.eventBus.SendEvent(events.EventJobFailed{JobName: job.Name()})
			} else {
				j.logger.Info("JOB: job finished successfully (%q)", job)
				j.eventBus.SendEvent(events.EventJobSuccessful{JobName: job.Name()})
			}
			if onSuccessful != nil {
				onSuccessful()
			}
		}()
	default:
		j.logger.Error("JOB: unknown job: %q", job)
		j.eventBus.SendEvent(events.EventJobFailed{JobName: job.Name()})
	}
}
