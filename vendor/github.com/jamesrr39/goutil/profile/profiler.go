package profile

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gogo/protobuf/proto"
	"github.com/google/uuid"
	"github.com/jamesrr39/goutil/errorsx"
)

type key int

var (
	runCtxKey      key = 1
	profilerCtxKey key = 2
)

func Middleware(profiler *Profiler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			runName := fmt.Sprintf("%s: %s", r.URL.String(), uuid.New().String())

			run := profiler.NewRun(runName)

			newCtx := r.Context()
			newCtx = context.WithValue(newCtx, runCtxKey, run)
			newCtx = context.WithValue(newCtx, profilerCtxKey, profiler)

			r = r.WithContext(newCtx)

			next.ServeHTTP(w, r)

			err := profiler.StopAndRecord(run, "")
			if err != nil {
				log.Printf("ERROR: profiler: could not StopAndRecord. Error: %q\n", err)
			}
		}

		return http.HandlerFunc(fn)
	}
}

func MarkOnCtx(ctx context.Context, eventName string) errorsx.Error {
	run := ctx.Value(runCtxKey)
	if run == nil {
		return errorsx.Errorf("Profile: MarkOnCtx: no profile run found on context")
	}
	profiler := ctx.Value(profilerCtxKey)
	if profiler == nil {
		return errorsx.Errorf("Profile: MarkOnCtx: no profile found on context")
	}

	p, ok := profiler.(*Profiler)
	if !ok {
		return errorsx.Errorf("Profile: MarkOnCtx: profiler type was not *Profiler (was %T)", profiler)
	}
	r, ok := run.(*Run)
	if !ok {
		return errorsx.Errorf("Profile: MarkOnCtx: run type was not *Run (was %T)", run)
	}

	p.Mark(r, eventName)
	return nil
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
