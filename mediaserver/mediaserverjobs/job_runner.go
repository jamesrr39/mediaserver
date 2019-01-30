package mediaserverjobs

import (
	"fmt"

	"github.com/jamesrr39/goutil/logger"
	"github.com/jamesrr39/semaphore"
)

type JobType int

const (
	JobTypeUnknown JobType = iota
	JobTypeCPUJob
)

type Job interface {
	run() error
	fmt.Stringer
	JobType() JobType
}

type JobRunner struct {
	logger      logger.Logger
	cpuJobsSema *semaphore.Semaphore
}

func NewJobRunner(logger logger.Logger, maxConcurrentJobs uint) *JobRunner {
	cpuJobsSema := semaphore.NewSemaphore(maxConcurrentJobs)
	return &JobRunner{logger, cpuJobsSema}
}

func (j *JobRunner) QueueJob(job Job) {
	j.logger.Info("JOB: running job: %q", job)

	switch job.JobType() {
	case JobTypeCPUJob:
		j.cpuJobsSema.Add()
		go func() {
			defer j.cpuJobsSema.Done()

			err := job.run()
			if err != nil {
				j.logger.Error("JOB: error running job %q. Error: %q", job, err)
			}
		}()
	default:
		j.logger.Error("JOB: unknown job: %q", job)
	}
}
