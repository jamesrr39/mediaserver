LOCALENV_BASE_DIR="$(shell pwd)/data/localenv"
DEFAULT_BUILD_OUTPUT=build/bin/default/mediaserver

.PHONY: help
help:
	echo "see Makefile"

.PHONY: clean
clean:
	rm -rf build

.PHONY: codegen
codegen:
	go run codegen/generate-main.go	

.PHONY: build_prod_x86_64
build_prod_x86_64: clean bundle_static_assets
	mkdir -p build/bin/x86_64
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/x86_64/mediaserver cmd/media-server-main.go

.PHONY: build_prod
build_prod: clean bundle_static_assets
	mkdir -p build/bin/default
	$(MAKE) compile_prod_go

# compiles the production Go application only. Does not recompile the JS client application.
.PHONY: compile_prod_go
compile_prod_go:
	env CGO_ENABLED=0 go build -tags "purego prod" -o ${DEFAULT_BUILD_OUTPUT} cmd/media-server-main.go
	echo "program built and placed at ${DEFAULT_BUILD_OUTPUT}"

# raspberry pi 3
.PHONY: build_prod_arm7
build_prod_arm7: clean bundle_static_assets
	mkdir -p build/bin/arm7
	env GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/arm7/mediaserver cmd/media-server-main.go

.PHONY: build_windows_x86_64
build_windows_x86_64:
	mkdir -p build/bin/windows_x86_64
	env GOOS=windows CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/windows_x86_64/mediaserver.exe cmd/media-server-main.go

.PHONY: run_dev_client
run_dev_client:
	cd client && yarn start

.PHONY: run_dev_server
run_dev_server:
	echo "localenv base dir: ${LOCALENV_BASE_DIR}"
	mkdir -p \
		${LOCALENV_BASE_DIR}/data \
		${LOCALENV_BASE_DIR}/metadata \
		${LOCALENV_BASE_DIR}/cache
	go run cmd/media-server-main.go \
		${LOCALENV_BASE_DIR}/data \
		--metadata-dir=${LOCALENV_BASE_DIR}/metadata \
		--cache-dir=${LOCALENV_BASE_DIR}/cache \
		--profile-dir=${LOCALENV_BASE_DIR}

.PHONY: clean_dev_metadata
clean_dev_metadata:
	rm -rf ${LOCALENV_BASE_DIR}/metadata/*

.PHONY: test
test:
	go vet -all ./...
	go test ./...
	cd client && yarn tslint && yarn test:ci

.PHONY: update_go_snapshots
update_go_snapshots:
	UPDATE_SNAPSHOTS=1 go test ./...

.PHONY: bundle_static_assets
bundle_static_assets:
	cd client && yarn build
	rsync -arh --delete client/dist/* mediaserver/statichandlers/client_static_files

.PHONY: deploy_to_raspberry_pi
deploy_to_raspberry_pi: test build_docker_linux_arm7
	docker save jamesrr39/mediaserver_arm7:latest | bzip2 | ssh raspberrypi 'bunzip2 | sudo docker load'

.PHONY: install
install: build_prod
	mv build/bin/default/mediaserver ${shell go env GOBIN}/

.PHONY: build4pi
# build4pi:
build4pi: build_prod_arm7
	mkdir -p docker/build
	rm -rf docker/build/*
	cp build/bin/arm7/mediaserver docker/build/mediaserver
	build4pi
