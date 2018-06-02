package testutil

import "sync"

type TestLogger struct {
	mu      sync.Mutex
	Entries []string
}

func NewTestLogger() *TestLogger {
	return &TestLogger{}
}

func (l *TestLogger) WriteString(message string, args ...interface{}) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.Entries = append(l.Entries)
}
