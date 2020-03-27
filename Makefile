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
	env CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/default/mediaserver cmd/media-server-main.go

# raspberry pi 3
.PHONY: build_prod_arm7
build_prod_arm7: clean bundle_static_assets
	mkdir -p build/bin/arm7
	env GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/arm7/mediaserver cmd/media-server-main.go

.PHONY: run_dev_client
run_dev_client:
	cd client && yarn start

.PHONY: run_dev_server
run_dev_server:
	mkdir -p ~/tmp/mediaserver/data ~/tmp/mediaserver/metadata ~/tmp/mediaserver/cache
	go run cmd/media-server-main.go ~/tmp/mediaserver/data --metadata-dir=~/tmp/mediaserver/metadata --cache-dir=~/tmp/mediaserver/cache --profile-dir=~/tmp/mediaserver

.PHONY: clean_dev_metadata
clean_dev_metadata:
	rm -rf ~/tmp/mediaserver/metadata/*

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
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client

.PHONY: build_docker_linux_x86_64
build_docker_linux_x86_64: build_prod_x86_64
	mkdir -p build/docker/x86_64/bin
	cp docker/linux_x86_64/Dockerfile build/docker/x86_64/Dockerfile
	cp build/bin/x86_64/mediaserver build/docker/x86_64/bin/mediaserver
	docker build -t jamesrr39/mediaserver_x86_64:latest build/docker/x86_64

.PHONY: build_docker_linux_arm7
build_docker_linux_arm7: build_prod_arm7
	mkdir -p build/docker/arm7/bin
	cp docker/arm7/Dockerfile build/docker/arm7/Dockerfile
	cp build/bin/arm7/mediaserver build/docker/arm7/bin/mediaserver
	docker build -t jamesrr39/mediaserver_arm7:latest build/docker/arm7

.PHONY: deploy_to_raspberry_pi
deploy_to_raspberry_pi: test build_docker_linux_arm7
	docker save jamesrr39/mediaserver_arm7:latest | bzip2 | ssh raspberrypi 'bunzip2 | sudo docker load'

.PHONY: install
install: build_prod
	mv build/bin/default/mediaserver ${shell go env GOBIN}/