

make build_docker_linux_x86_64 && docker run -v ~/tmp/mediaserver:/var/local/mediaserver/data jamesrr39/mediaserver_x86_64:latest

you should probably also mount the metadata dir in a volume too, to prevent loss of data
