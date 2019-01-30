FROM alpine:3.7
# FROM armhf/alpine:3.5

COPY bin/mediaserver /opt/mediaserver

EXPOSE 9050

RUN addgroup -S mediaserver && adduser -S -u 1001 mediaserver mediaserver

RUN chown mediaserver:mediaserver /opt/mediaserver

WORKDIR /home/mediaserver

USER mediaserver

RUN mkdir -p /home/mediaserver/cache /home/mediaserver/data /home/mediaserver/metadata

# copy this to the build folder and add the binary there

# ENTRYPOINT ["ls", "-l", "/opt"]
ENTRYPOINT ["/opt/mediaserver", "/home/mediaserver/data", "--addr=:9050", "--cache-dir=/home/mediaserver/cache", "--metadata-dir=/home/mediaserver/metadata", "--profile-dir=/home/mediaserver", "--max-concurrent-cpu-jobs=4"]
