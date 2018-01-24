build:
	go build -o bin/media-server cmd/media-server-main.go

#run_dev_server:
#	go run cmd/media-server-main.go

run_dev_client:
	cd client && yarn start
