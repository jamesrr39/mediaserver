## Run

### Docker

Make sure the user IDs are set to be the same between the host and guest

    make build_docker_linux_x86_64 && docker run -v ~/tmp/mediaserver:/var/local/mediaserver/data jamesrr39/mediaserver_x86_64:latest
