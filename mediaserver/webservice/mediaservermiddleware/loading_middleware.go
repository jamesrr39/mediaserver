package mediaservermiddleware

import (
	"net/http"
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
