clean:
	rm -rf build

build_prod_x86_64: clean bundle_static_assets
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client
	go build -tags "purego prod" -o bin/media-server cmd/media-server-main.go

#run_dev_server:
#	go run cmd/media-server-main.go

run_dev_client:
	cd client && yarn start

test:
	go vet -all ./...
	go test ./...

bundle_static_assets:
	cd client && yarn build

# build_docker_raspberry_pi_3:
#        mkdir -p bin/docker/x86-64/mediaserver
#        env CGO_ENABLED=0 GOARM=7 GOARCH=arm go build -tags "purego prod" -o docker/tracks-raspberry-pi/bin/tracks-app-raspberry-pi cmd/tracks-app-main.go
#       docker build -t jamesrr39/tracks-app-raspberry-pi docker/tracks-raspberry-pi

build_docker_linux_x86_64:
	mkdir -p bin/docker/x86-64
	docker build -t jamesrr39/tracks-app-raspberry-pi docker/tracks-raspberry-pi
