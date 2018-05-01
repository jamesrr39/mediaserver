// +build prod

package statichandlers

import (
	"log"
	"net/http"

	_ "mediaserverapp/build/client/statik"

	"github.com/rakyll/statik/fs"
)

func NewClientHandler() http.Handler {
	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	return http.FileServer(statikFS)

	// http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(statikFS)))
}

// func NewClientHandler() http.Handler {
// 	return &ClientHandler{}
// }
//
// type ClientHandler struct{}
//
// func (h *ClientHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
// 	originalPath := r.URL.Path
// 	path := strings.TrimPrefix(originalPath, "/")
// 	if path == "" {
// 		path = "index.html"
// 	}
//
// 	assetBytes, err := clientbundle.Asset(path)
// 	if nil != err {
// 		http.Error(w, err.Error(), 404)
// 		return
// 	}
//
// 	_, err = w.Write(assetBytes)
// 	if nil != err {
// 		http.Error(w, fmt.Sprintf("couldn't write to the response. Error: %s\n", err), 500)
// 		return
// 	}
// }
