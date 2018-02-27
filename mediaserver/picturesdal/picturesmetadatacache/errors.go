package picturesmetadatacache

type ErrItemAlreadyExists struct{}

func (e *ErrItemAlreadyExists) Error() string {
	return "item already exists"
}
