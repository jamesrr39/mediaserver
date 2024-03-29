.PHONY:	all clean cover cpu editor internalError later mem nuke todo edit

grep=--include=*.go --include=*.l --include=*.y --include=*.yy
ngrep='TODOOK\|parser\.go\|scanner\.go\|.*_string\.go'

all: editor
	go vet 2>&1 | grep -v $(ngrep) || true
	golint 2>&1 | grep -v $(ngrep) || true
	make todo
	-unused .
	-misspell *.go
	-gosimple

clean:
	go clean
	rm -f *~ *.test *.out

cover:
	t=$(shell tempfile) ; go test -coverprofile $$t && go tool cover -html $$t && unlink $$t

cpu: clean
	go test -run @ -bench . -cpuprofile cpu.out
	go tool pprof -lines *.test cpu.out

edit:
	gvim -p Makefile *.go &

editor:
	gofmt -l -s -w *.go
	go test
	go build

generic:
	@# writes to stdout a version where the type of key is KEY and the type
	@# of value is VALUE.
	@#
	@# Intended use is to replace all textual occurrences of KEY or VALUE in
	@# the output with your desired types.
	@sed -e 's|interface{}[^{]*/\*K\*/|KEY|g' -e 's|interface{}[^{]*/\*V\*/|VALUE|g' btree.go

internalError:
	egrep -ho '"internal error.*"' *.go | sort | cat -n

later:
	grep -n $(grep) LATER * || true
	grep -n $(grep) MAYBE * || true

mem: clean
	go test -run @ -bench . -memprofile mem.out -memprofilerate 1 -timeout 24h
	go tool pprof -lines -web -alloc_space *.test mem.out

nuke: clean
	go clean -i

todo:
	grep -nr $(grep) ^[[:space:]]*_[[:space:]]*=[[:space:]][[:alpha:]][[:alnum:]]* * | grep -v $(ngrep) || true
	grep -nr $(grep) TODO * | grep -v $(ngrep) || true
	grep -nr $(grep) BUG * | grep -v $(ngrep) || true
	grep -nr $(grep) [^[:alpha:]]println * | grep -v $(ngrep) || true
