FROM alpine:3.7
# FROM armhf/alpine:3.5

RUN mkdir -p /var/local/mediaserver
RUN mkdir -p /var/cache/mediaserver

COPY bin/mediaserver /opt/mediaserver

EXPOSE 9050

RUN addgroup -S pi && adduser -S -g pi pi

RUN chown -R pi:pi /var/local/mediaserver
RUN chown -R pi:pi /var/cache/mediaserver
RUN chown pi:pi /opt/mediaserver

WORKDIR /home/pi

USER pi

# copy this to the build folder and add the binary there

# ENTRYPOINT ["ls", "-l", "/opt"]
ENTRYPOINT ["/opt/mediaserver", "/var/local/mediaserver/data", "--addr=:9050", "--cache-dir=/var/cache/mediaserver", "--metadata-dir=/var/local/mediaserver/metadata"]
