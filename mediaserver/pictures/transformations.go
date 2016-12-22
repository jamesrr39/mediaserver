package pictures

import (
	"image"
	"log"

	"github.com/disintegration/imaging"
)

type Size struct {
	Width  uint
	Height uint
}

func ResizePicture(picture image.Image, size Size) image.Image {
	return imaging.Resize(picture, int(size.Width), int(size.Height), imaging.Lanczos)
}

func flipAndRotatePictureByExif(picture image.Image, exifOrientation int) image.Image {
	log.Printf("orientation: %d\n", exifOrientation)

	// flip
	switch exifOrientation {
	case 1, 3, 8: // do nothing
	case 2, 4:
		picture = imaging.FlipH(picture)
	case 5, 7:
		picture = imaging.FlipV(picture)
	}

	// rotate
	switch exifOrientation {
	case 1, 2: // do nothing
	case 5, 6:
		picture = imaging.Rotate270(picture)
	case 3, 4:
		picture = imaging.Rotate180(picture)
	case 7, 8:
		picture = imaging.Rotate90(picture)
	}

	return picture

}
