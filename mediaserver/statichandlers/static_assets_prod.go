//go:build prod

package statichandlers

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/jamesrr39/goutil/errorsx"
)

//go:embed client_static_files
var clientFs embed.FS

func NewClientHandler() (http.Handler, errorsx.Error) {
	clientHandler, err := fs.Sub(clientFs, "client_static_files")
	if err != nil {
		return nil, errorsx.Wrap(err)
	}

	return http.FileServer(http.FS(clientHandler)), nil
}
