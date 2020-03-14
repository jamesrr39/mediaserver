package events

import "sync"

type EventName string

type EventBus struct {
	mu          sync.RWMutex
	subscribers []*Subscriber
}

type Event interface {
	Name() EventName
}

func (eb *EventBus) SendEvent(event Event) {
	eb.mu.RLock()
	eb.mu.RUnlock()
	for _, subscriber := range eb.subscribers {
		subscriber.Ch <- event
	}
}

type Subscriber struct {
	ListenToPatterns []ListenToPattern
	SubscriberName   string
	Ch               chan Event
}

// ListenToPattern is the pattern of event name to listen to
// e.g. '*', 'picture.*', 'picture.thumbnailsJob.finished'
type ListenToPattern string

func (eb *EventBus) Subscribe(subscriber *Subscriber) {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.subscribers = append(eb.subscribers, subscriber)
}
