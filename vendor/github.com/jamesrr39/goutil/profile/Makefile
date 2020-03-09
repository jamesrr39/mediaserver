
.PHONY: generate-protobufs
generate-protobufs:
	# to install protobuf packages/binaries
	# go get github.com/gogo/protobuf/protoc-gen-gofast
	# go get github.com/gogo/protobuf/proto
	# go get github.com/gogo/protobuf/protoc-gen-gogoslick
	# go get github.com/gogo/protobuf/gogoproto
	protoc -I=. -I=${GOPATH}/src -I=${GOPATH}/src/github.com/gogo/protobuf/protobuf --gogoslick_out=. profiler.proto
