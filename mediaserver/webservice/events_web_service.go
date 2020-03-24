package webservice

import (
	"log"
	"mediaserver/mediaserver/events"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/logpkg"
)

type WebsocketClient struct {
	conn   *websocket.Conn
	sendCh chan events.Event
}

type EventsWebService struct {
	chi.Router
	logger    *logpkg.Logger
	clients   []*WebsocketClient
	clientsMu sync.RWMutex
}

func NewEventsWebService(logger *logpkg.Logger, eventChan chan events.Event) *EventsWebService {
	ws := &EventsWebService{chi.NewMux(), logger, nil, sync.RWMutex{}}

	go func() {
		for {
			ev := <-eventChan
			ws.sendMessage(ev)
		}
	}()

	ws.Get("/", ws.handleGet)

	return ws
}

func (ws *EventsWebService) sendMessage(event events.Event) {
	ws.clientsMu.RLock()
	defer ws.clientsMu.RUnlock()

	for _, client := range ws.clients {
		client.sendCh <- event
	}
}

func (ws *EventsWebService) handleGet(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		errorsx.HTTPError(w, ws.logger, errorsx.Wrap(err), http.StatusInternalServerError)
		return
	}

	websocketClient := &WebsocketClient{conn, make(chan events.Event, 256)}

	ws.addClient(websocketClient)

	go ws.writeMessages(websocketClient)
}

func (ws *EventsWebService) addClient(client *WebsocketClient) {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()

	ws.clients = append(ws.clients, client)
}

func (ws *EventsWebService) writeMessages(c *WebsocketClient) {
	interruptChan := make(chan os.Signal, 1)

	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case event, ok := <-c.sendCh:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The client closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write([]byte(event.Name()))

			// Add queued messages to the current websocket message.
			n := len(c.sendCh)
			for i := 0; i < n; i++ {
				w.Write(newline)
				event := <-c.sendCh
				w.Write([]byte(event.Name()))
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			err := c.conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				ws.logger.Warn("error writing to websocket: %v", err)
				return
			}
		case <-interruptChan:
			// Cleanly close the connection by sending a close message and then
			// waiting (with timeout) for the server to close the connection.
			err := c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return
			}
		}
	}
}

var (
	newline  = []byte(`\n`)
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// TODO cross-site request forgery protection?
			return true
		},
	}
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)
