// +build !prod

package statichandlers

import (
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/httpextra"
)

func NewClientHandler() (http.Handler, errorsx.Error) {
	return httpextra.NewLocalDevServerProxy()
}
