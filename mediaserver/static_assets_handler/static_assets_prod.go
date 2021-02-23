// +build prod

package statichandlers

import (
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/rakyll/statik/fs"
)

func NewClientHandler() (http.Handler, errorsx.Error) {
	statikFS, err := fs.New()
	if err != nil {
		return errorsx.Wrap(err)
	}

	return http.FileServer(statikFS), nil
}
