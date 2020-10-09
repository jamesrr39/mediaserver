package mediaservermiddleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/jamesrr39/goutil/logpkg"
)

func LoadingMiddleware(readyChan chan bool) func(http.Handler) http.Handler {
	var ready bool
	go func() {
		for {
			ready = <-readyChan
		}
	}()
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			if !ready {
				http.Error(w, "scanning...", http.StatusInternalServerError)
				return
			}
			next.ServeHTTP(w, r)
		}

		return http.HandlerFunc(fn)
	}
}

func CreateRequestLoggerMiddleware(log *logpkg.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			startTime := time.Now()
			ww := NewBodyWriter(w, r)
			defer func() {
				duration := time.Now().Sub(startTime)
				go func() {
					status := ww.Status()
					requestSummary := fmt.Sprintf("%s %s %d, took %s", r.Method, r.URL.String(), status, duration.String())
					if status < 400 {
						log.Info(requestSummary)
						return
					}

					if status < 500 {
						log.Warn("%s\n%s", requestSummary, ww.ResponseBody.String())
						return
					}

					log.Error("%s\n%s", requestSummary, ww.ResponseBody.String())
				}()
			}()

			next.ServeHTTP(ww, r)
		}

		return http.HandlerFunc(fn)
	}
}
