clean:
	rm -rf build

build_prod_x86_64: clean bundle_static_assets
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client
	mkdir -p build/bin/x86_64
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/x86_64/mediaserver cmd/media-server-main.go

# raspberry pi 3
build_prod_arm7: clean bundle_static_assets
	go run vendor/github.com/rakyll/statik/statik.go -src=client/build -dest=build/client
	mkdir -p build/bin/arm7
	env GOOS=linux GOARCH=arm GOARM=7 CGO_ENABLED=0 go build -tags "purego prod" -o build/bin/arm7/mediaserver cmd/media-server-main.go

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

build_docker_linux_x86_64: build_prod_x86_64
	mkdir -p build/docker/x86_64/bin
	cp docker/linux_x86_64/Dockerfile build/docker/x86_64/Dockerfile
	cp build/bin/x86_64/mediaserver build/docker/x86_64/bin/mediaserver
	docker build -t jamesrr39/mediaserver_x86_64:latest build/docker/x86_64

build_docker_linux_arm7: build_prod_arm7
	mkdir -p build/docker/arm7/bin
	cp docker/arm7/Dockerfile build/docker/arm7/Dockerfile
	cp build/bin/arm7/mediaserver build/docker/arm7/bin/mediaserver
	docker build -t jamesrr39/mediaserver_arm7:latest build/docker/arm7

deploy_to_raspberry_pi: build_docker_linux_arm7
	docker save jamesrr39/mediaserver_arm7:latest | bzip2 | ssh raspberrypi 'bunzip2 | sudo docker load'
