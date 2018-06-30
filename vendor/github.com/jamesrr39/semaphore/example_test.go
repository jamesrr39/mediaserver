package semaphore_test

import (
	"fmt"
	"os"
	"time"

	"github.com/jamesrr39/semaphore"
)

func ExampleSemaphore() {
	s := semaphore.NewSemaphore(4)
	for i := 0; i < 22; i++ {
		s.Add()
		go func(i int) {
			defer func() {
				s.Done()
				fmt.Printf("finished %d\n", i)
			}()
			fmt.Printf("running: %d\n", i)
			time.Sleep(time.Second * time.Duration(i))
		}(i)
	}
	s.Wait()
}

// ExampleSemaphoreWithErrorHandling shows an example with some error handling that avoids doing the hard work if there has already been an error
func ExampleSemaphore_withErrorHandling() {
	s := semaphore.NewSemaphore(4)
	var outerErr error
	for i := 0; i < 3; i++ {
		s.Add()
		go func(i int) {
			defer s.Done()
			if outerErr != nil {
				// skip the hard work below if there has previously been an error
				return
			}

			file, err := os.Open(fmt.Sprintf("myfile%d.txt", i))
			if err != nil {
				outerErr = err
				return
			}
			defer file.Close()

			// do some hard work with the file here...
		}(i)
	}
	s.Wait()
	if outerErr != nil {
		// handle error here
	}
}
