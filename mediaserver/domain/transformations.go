package domain

import (
	"image"
	"log"

	"github.com/disintegration/imaging"
	"github.com/jamesrr39/semaphore"
)

type Size struct {
	Width  uint
	Height uint
}

type PictureResizer struct {
	sema *semaphore.Semaphore
}

func NewPictureResizer(maxConcurrentOps uint) *PictureResizer {
	return &PictureResizer{semaphore.NewSemaphore(maxConcurrentOps)}
}

func (pr *PictureResizer) ResizePicture(picture image.Image, size Size) image.Image {
	log.Printf("resizing to %v. %d ops currently running\n", size, pr.sema.CurrentlyRunning())
	pr.sema.Add()
	defer pr.sema.Done()
	return imaging.Resize(picture, int(size.Width), int(size.Height), imaging.Lanczos)
}
