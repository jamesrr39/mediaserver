package events

import (
	"regexp"
	"sync"

	"github.com/jamesrr39/goutil/errorsx"
)

type EventBus struct {
	mu          sync.RWMutex
	subscribers []*Subscriber
}

func NewEventBus() *EventBus {
	return &EventBus{sync.RWMutex{}, nil}
}

type Event interface {
	Name() string
}

func (eb *EventBus) SendEvent(event Event) {
	eventName := event.Name()

	eb.mu.RLock()
	eb.mu.RUnlock()
	for _, subscriber := range eb.subscribers {
		// if subscriber.
		var shouldSubscriberReceiveMessage bool
		for _, pat := range subscriber.ListenToPatterns {
			if pat.MatchString(eventName) {
				shouldSubscriberReceiveMessage = true
				break
			}
		}
		if !shouldSubscriberReceiveMessage {
			continue
		}
		subscriber.Chan <- event
	}
}

type Subscriber struct {
	// ListenToPattern is the pattern of event name to listen to
	ListenToPatterns []*regexp.Regexp
	Name             string
	Chan             chan Event
}

// NewSubscriber creates a new subscriber
// listenToPatterns is a regexp pattern to match events with e.g. '(.*?)', 'picture\.(.*?)', 'picture\.thumbnailsJob\.finished'
func NewSubscriber(name string, listenToPatterns ...string) (*Subscriber, errorsx.Error) {
	s := &Subscriber{Name: name, Chan: make(chan Event)}
	for _, listenToPattern := range listenToPatterns {
		re, err := regexp.Compile(listenToPattern)
		if err != nil {
			return nil, errorsx.Wrap(err)
		}
		s.ListenToPatterns = append(s.ListenToPatterns, re)
	}

	return s, nil
}

func (eb *EventBus) Subscribe(subscriber *Subscriber) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.subscribers = append(eb.subscribers, subscriber)
}
