package fit

import (
	"fmt"

	"github.com/tormoder/fit/internal/types"
)

// field represents a fit message field in the profile field lookup table.
type field struct {
	sindex int
	num    byte
	t      types.Fit
}

func (f field) String() string {
	return fmt.Sprintf("sindex: %d | num: %d | type: %v", f.sindex, f.num, f.t)
}
