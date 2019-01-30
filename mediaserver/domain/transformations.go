package domain

import (
	"image"

	"github.com/disintegration/imaging"
)

func ResizePicture(picture image.Image, size Size) *image.NRGBA {
	return imaging.Resize(picture, int(size.Width), int(size.Height), imaging.Lanczos)
}
