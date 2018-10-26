// +build !prod

package mediaservermiddleware

import (
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
)

func ApplyCorsMiddleware(router chi.Router) {
	cors := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		MaxAge:         300, // Maximum value not ignored by any of major browsers
	})
	router.Use(cors.Handler)
}
