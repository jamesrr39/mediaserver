package mediaserver

import (
	"fmt"
	"log"
)

type ProductionLogger struct {
}

func NewProductionLogger() *ProductionLogger {
	return &ProductionLogger{}
}

func (l *ProductionLogger) Printlnf(message string, args ...interface{}) {
	text := fmt.Sprintf(message, args)
	log.Println(text)
}
