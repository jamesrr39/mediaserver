FROM alpine:3.7

RUN mkdir -p /var/local/mediaserver
RUN mkdir -p /var/cache/mediaserver

COPY bin/mediaserver /opt/mediaserver

EXPOSE 9050

RUN addgroup -S user && adduser -S -g user user

RUN chown -R user:user /var/local/mediaserver
RUN chown -R user:user /var/cache/mediaserver
RUN chown user:user /opt/mediaserver

WORKDIR /home/user

USER user

ENTRYPOINT ["/opt/mediaserver", "/var/local/mediaserver/data", "--addr=:9050", "--cache-dir=/var/cache/mediaserver", "--metadata-dir=/var/local/mediaserver/metadata"]
