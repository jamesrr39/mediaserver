// +build !prod

package mediaservermiddleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

func CorsMiddleware() func(http.Handler) http.Handler {
	return cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		MaxAge:         300, // Maximum value not ignored by any of major browsers
	}).Handler
}
