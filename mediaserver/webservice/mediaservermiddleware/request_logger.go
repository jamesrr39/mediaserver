package mediaservermiddleware

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/middleware"
	"github.com/jamesrr39/goutil/logger"
)

type BodyWriter struct {
	middleware.WrapResponseWriter
	ResponseBody *bytes.Buffer
}

func NewBodyWriter(w http.ResponseWriter, r *http.Request) *BodyWriter {
	return &BodyWriter{
		middleware.NewWrapResponseWriter(w, r.ProtoMajor),
		bytes.NewBuffer(nil),
	}
}

func (bw *BodyWriter) Write(data []byte) (int, error) {
	bw.ResponseBody.Write(data)
	return bw.WrapResponseWriter.Write(data)
}

func CreateRequestLoggerMiddleware(log logger.Logger) func(http.Handler) http.Handler {
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
