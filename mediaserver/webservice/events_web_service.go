package webservice

import (
	"bytes"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type WebsocketClient struct {
	conn   *websocket.Conn
	sendCh chan []byte
}

type EventsWebService struct {
	chi.Router
	logger    *logpkg.Logger
	clients   []*WebsocketClient
	clientsMu sync.Mutex
}

func NewEventsWebService(logger *logpkg.Logger) *EventsWebService {
	ws := &EventsWebService{chi.NewMux(), logger, nil, sync.Mutex{}}

	return ws
}

func (ws *EventsWebService) handleGet(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	websocketClient := &WebsocketClient{conn, make(chan []byte, 256)}

	go ws.writeMessages(websocketClient)
	go ws.readMessages(websocketClient)
}

func (ws *EventsWebService) writeMessages(c *WebsocketClient) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.sendCh:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.sendCh)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.sendCh)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (ws *EventsWebService) readMessages(c *WebsocketClient) {
	defer func() {
		for i, client := range ws.clients {
			if client != c {
				continue
			}

			ws.clientsMu.Lock()
			defer ws.clientsMu.Unlock()

			// remove client from list of subscribed clients
			ws.clients = append(ws.clients[:i], ws.clients[i+1:]...)
			break
		}
		defer c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

	}
}

var (
	newline = []byte(`\n`)
	space   = []byte(` `)
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)
