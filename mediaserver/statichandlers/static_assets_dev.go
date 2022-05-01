//go:build !prod
// +build !prod

package statichandlers

import (
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
)

func NewClientHandler() (http.Handler, errorsx.Error) {
	return http.FileServer(http.Dir("client/dist")), nil
}
