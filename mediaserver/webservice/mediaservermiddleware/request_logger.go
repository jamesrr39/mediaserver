package mediaservermiddleware

import (
	"bufio"
	"bytes"
	"net"
	"net/http"

	"github.com/go-chi/chi/middleware"
)

type BodyWriter struct {
	middleware.WrapResponseWriter
	ResponseBody *bytes.Buffer
}

func NewBodyWriter(w http.ResponseWriter, r *http.Request) *BodyWriter {
	return &BodyWriter{
		middleware.NewWrapResponseWriter(w, r.ProtoMajor),
		bytes.NewBuffer(nil),
	}
}

func (bw *BodyWriter) Write(data []byte) (int, error) {
	bw.ResponseBody.Write(data)
	return bw.WrapResponseWriter.Write(data)
}

func (bw *BodyWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	h, ok := bw.WrapResponseWriter.(http.Hijacker)
	if !ok {
		panic("underlying response writer is not hijacker")
	}

	return h.Hijack()
}
