// +build prod

package webservices

import (
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
	"github.com/rakyll/statik/fs"
)

func NewStaticFilesService() (http.Handler, errorsx.Error) {
	statikFS, err := fs.New()
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return http.FileServer(statikFS), nil
}
