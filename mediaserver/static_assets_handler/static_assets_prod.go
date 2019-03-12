// +build prod

package statichandlers

import (
	"log"
	"net/http"

	_ "mediaserver/build/client/statik"

	"github.com/rakyll/statik/fs"
)

func NewClientHandler() http.Handler {
	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	return http.FileServer(statikFS)
}
