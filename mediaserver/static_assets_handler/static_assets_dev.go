// +build !prod

package statichandlers

import "net/http"

func NewClientHandler() http.Handler {
	return http.FileServer(http.Dir("client"))
}
