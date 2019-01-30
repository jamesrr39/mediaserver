package domain

import (
	"strconv"
)

type Size struct {
	Width  uint
	Height uint
}

// widthAndHeightStringsToSize scales the maximum picture dimenions to the width and height URL Query parameters
// it will use the smallest size
// example: Picture 300w x 400h , widthParam "600" heightParam "900"
// resulting size: 600 x 800
// we won't size the picture up from the original picture size
func WidthAndHeightStringsToSize(widthParam, heightParam string, pictureSize Size) (Size, error) {
	if "" == widthParam && "" == heightParam {
		return pictureSize, nil
	}

	var width, height int
	var err error
	if "" == widthParam {
		width = int(pictureSize.Width)
	} else {
		width, err = strconv.Atoi(widthParam)
		if nil != err {
			return Size{}, err
		}
	}

	if "" == heightParam {
		height = int(pictureSize.Height)
	} else {
		height, err = strconv.Atoi(heightParam)
		if nil != err {
			return Size{}, err
		}
	}

	// max allowed width; smallest from picture width or width from param
	maxAllowedWidth := int(pictureSize.Width)
	if width < maxAllowedWidth {
		maxAllowedWidth = width
	}

	// max allowed height; smallest from picture height or height from param
	maxAllowedHeight := int(pictureSize.Height)
	if height < maxAllowedHeight {
		maxAllowedHeight = height
	}

	widthRatio := float64(maxAllowedWidth) / float64(int(pictureSize.Width))
	heightRatio := float64(maxAllowedHeight) / float64(int(pictureSize.Height))

	smallestRatio := widthRatio
	if heightRatio < smallestRatio {
		smallestRatio = heightRatio
	}

	return Size{
		Width:  uint(float64(pictureSize.Width) * smallestRatio),
		Height: uint(float64(pictureSize.Height) * smallestRatio),
	}, nil
}
