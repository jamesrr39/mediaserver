package pictures

import (
	"image"

	"github.com/disintegration/imaging"
)

type Size struct {
	Width  uint
	Height uint
}

func ResizePicture(picture image.Image, size Size) image.Image {
	return imaging.Resize(picture, int(size.Width), int(size.Height), imaging.Lanczos)
}
