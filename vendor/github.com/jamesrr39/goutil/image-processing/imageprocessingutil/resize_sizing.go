package imageprocessingutil

func GetResizeSize(pictureSize, limit Size) Size {
	// max allowed width; smallest from picture width or width from param
	maxAllowedWidth := pictureSize.Width
	if limit.Width < maxAllowedWidth {
		maxAllowedWidth = limit.Width
	}

	// max allowed height; smallest from picture height or height from param
	maxAllowedHeight := pictureSize.Height
	if limit.Height < maxAllowedHeight {
		maxAllowedHeight = limit.Height
	}

	widthRatio := float64(maxAllowedWidth) / float64(pictureSize.Width)
	heightRatio := float64(maxAllowedHeight) / float64(pictureSize.Height)

	smallestRatio := widthRatio
	if heightRatio < smallestRatio {
		smallestRatio = heightRatio
	}

	return Size{
		Width:  int(float64(pictureSize.Width) * smallestRatio),
		Height: int(float64(pictureSize.Height) * smallestRatio),
	}
}
