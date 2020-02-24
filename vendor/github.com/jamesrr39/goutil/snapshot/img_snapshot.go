package snapshot

import (
	"bufio"
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"io"
	"io/ioutil"
	"math"
	"os"
	"strconv"
	"strings"
	"testing"
)

type Cell struct {
	Color color.Color
}

type Row struct {
	Cells []*Cell
}

type ImageSnapshot struct {
	Rows []*Row
}

func MakeSnapshot(img image.Image) *ImageSnapshot {
	snapshot := new(ImageSnapshot)
	bounds := img.Bounds()
	for y := 0; y < bounds.Max.Y; y++ {
		row := new(Row)
		for x := 0; x < bounds.Max.X; x++ {
			cell := &Cell{
				Color: img.At(x, y),
			}
			row.Cells = append(row.Cells, cell)
		}
		snapshot.Rows = append(snapshot.Rows, row)
	}
	return snapshot
}

type rowCell struct {
	ColorString string
	Count       int
}

func rowCellsToString(rowCells []*rowCell) string {
	var s []string
	for _, rc := range rowCells {
		s = append(s, fmt.Sprintf("%d %s", rc.Count, rc.ColorString))
	}
	return strings.Join(s, "|")
}

func (snapshot *ImageSnapshot) String() string {
	var rowStrings []string
	for _, row := range snapshot.Rows {
		rowCells := []*rowCell{}
		var lastColor string
		cellsOfColorInARow := 0

		for idx, cell := range row.Cells {
			thisColorString := colorToString(cell.Color)
			if lastColor != thisColorString {
				if cellsOfColorInARow != 0 {
					rowCells = append(rowCells, &rowCell{
						ColorString: lastColor,
						Count:       cellsOfColorInARow,
					})
				}
				cellsOfColorInARow = 1
				lastColor = thisColorString
			} else {
				cellsOfColorInARow++
				if idx == len(row.Cells)-1 {
					// last cell
					if cellsOfColorInARow != 0 {
						rowCells = append(rowCells, &rowCell{
							ColorString: lastColor,
							Count:       cellsOfColorInARow,
						})
					}
				}
			}
		}

		rowStrings = append(rowStrings, rowCellsToString(rowCells))
	}
	return strings.Join(rowStrings, "\n")
}

func (snapshot *ImageSnapshot) Image() image.Image {
	xSize := 0
	for _, row := range snapshot.Rows {
		if len(row.Cells) > xSize {
			xSize = len(row.Cells)
		}
	}

	img := image.NewRGBA(image.Rect(0, 0, xSize, len(snapshot.Rows)))

	for rowIndex, row := range snapshot.Rows {
		for cellIndex, cell := range row.Cells {
			r, g, b, a := cell.Color.RGBA()

			img.SetRGBA(cellIndex, rowIndex, color.RGBA{
				uint32ColourToByte(r),
				uint32ColourToByte(g),
				uint32ColourToByte(b),
				uint32ColourToByte(a),
			})
		}
	}

	return img
}

func colorToString(color color.Color) string {
	r, g, b, a := color.RGBA()
	return fmt.Sprintf("%d,%d,%d,%d", r, g, b, a)
}

func Parse(reader io.Reader) (*ImageSnapshot, error) {
	imgSnapshot := new(ImageSnapshot)

	buf := bufio.NewScanner(reader)
	for buf.Scan() {
		row := new(Row)
		line := buf.Text()
		if line == "" {
			continue
		}
		fragments := strings.Split(line, "|")
		for _, fragment := range fragments {
			cellFragments := strings.Split(fragment, " ")
			count, err := strconv.ParseUint(cellFragments[0], 10, 64)
			if err != nil {
				return nil, err
			}
			colorFragments := strings.Split(cellFragments[1], ",")

			r, g, b, a, err := colorFragmentsToColors(colorFragments)
			if err != nil {
				return nil, err
			}

			for i := uint64(0); i < count; i++ {
				row.Cells = append(row.Cells, &Cell{
					color.RGBA{
						R: r,
						G: g,
						B: b,
						A: a,
					},
				})
			}
		}
		imgSnapshot.Rows = append(imgSnapshot.Rows, row)
	}

	if buf.Err() != nil {
		return nil, buf.Err()
	}

	return imgSnapshot, nil
}

func colorFragmentsToColors(fragments []string) (r, g, b, a uint8, err error) {
	uints := make([]uint8, 4)
	for index, fragment := range fragments {
		val, err := strconv.ParseUint(fragment, 10, 8)
		if err != nil {
			return 0, 0, 0, 0, err
		}
		uints[index] = uint8(val)
	}
	return uints[0], uints[1], uints[2], uints[3], nil
}

func AssertEqual(t *testing.T, expected string, actual image.Image) {
	actualSnapshot := MakeSnapshot(actual)

	if expected == actualSnapshot.String() {
		return
	}

	t.Fail()
	t.Logf("expected: %q\nactual: %q\n", expected, actualSnapshot.String())

	expectedSnapshot, err := Parse(bytes.NewBuffer([]byte(expected)))
	if err != nil {
		t.Errorf("couldn't build a snapshot image from the string provided. Error: %q.\nSnapshot string: %s\n", err, expected)
		return
	}

	tmpSnapshotComparisionDir := "/tmp/go-snapshot"

	err = os.MkdirAll(tmpSnapshotComparisionDir, 0755)
	if err != nil {
		t.Logf("failed to make snapshot comparision dir at %s. Error: %q\n", tmpSnapshotComparisionDir, err)
		return
	}

	tempFile, err := ioutil.TempFile(tmpSnapshotComparisionDir, "go-snapshot*.jpg")
	if err != nil {
		t.Logf("failed to make snapshot comparision image. Error: %q\n", err)
		return
	}
	defer tempFile.Close()

	expectedImg := expectedSnapshot.Image()

	xMiddleMarginPx := 10

	joinedX := expectedImg.Bounds().Max.X + xMiddleMarginPx + actual.Bounds().Max.X
	joinedY := int(math.Max(float64(expectedImg.Bounds().Max.Y), float64(actual.Bounds().Max.Y)))

	joinedImg := image.NewRGBA(image.Rect(0, 0, joinedX, joinedY))
	grey := color.RGBA{R: 0xc1, G: 0xb6, B: 0xc0}

	// base color
	draw.Draw(joinedImg, joinedImg.Bounds(), image.NewUniform(grey), image.ZP, draw.Src)

	// draw on expected
	draw.Draw(
		joinedImg,
		expectedImg.Bounds(),
		// image.Rect(5, 0, 15, 10),
		expectedImg,
		image.ZP,
		draw.Src,
	)

	// draw on actual
	draw.Draw(
		joinedImg,
		// joinedImg.Bounds(),
		image.Rect(expectedImg.Bounds().Max.X+xMiddleMarginPx, 0, joinedX, joinedY),
		actual,
		image.ZP,
		// image.Point{X: expectedImg.Bounds().Max.X + xMiddleMarginPx - 1},
		draw.Src,
	)

	err = jpeg.Encode(tempFile, joinedImg, nil)
	if err != nil {
		t.Logf("failed to write the comparision image. Error: %q\n", err)
		return
	}

	t.Logf("snapshot image comparision written to %q\n", tempFile.Name())
	return
}

// func AssertSnapshotEqual(t *testing.T, actual image.Image) {
// 	_, callerFile, callerLine, ok := runtime.Caller(1)
// 	if !ok {
// 		t.Error("couldn't fetch the caller file")
// 		return
// 	}

// 	println(callerFile)

// 	AssertEqual(t)
// }

func uint32ColourToByte(value uint32) byte {
	const ratio = float64(256) / float64(65536)
	byteValue := ratio * float64(value)
	if byteValue > 255 {
		return byte(255)
	}
	return byte(byteValue)
}
