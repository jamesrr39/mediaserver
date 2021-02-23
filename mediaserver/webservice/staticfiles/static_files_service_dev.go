// +build !prod

package webservices

import (
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
)

func NewStaticFilesService() (http.Handler, errorsx.Error) {
	return httpextra.NewLocalDevServerMiddleware()
}
