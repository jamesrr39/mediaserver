// +build prod

package mediaservermiddleware

import "net/http"

func CorsMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(next.ServeHTTP)
	}
}
