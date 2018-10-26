// +build prod

package mediaservermiddleware

import (
	"github.com/go-chi/chi"
)

func ApplyCorsMiddleware(router chi.Router) {
	// no-op
}
