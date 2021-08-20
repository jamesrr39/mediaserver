FROM alpine:latest


EXPOSE 9050
VOLUME [ "/var/lib/mediaserver" ]

RUN mkdir -p \
    /var/lib/mediaserver/cache \
    /var/lib/mediaserver/data \
    /var/lib/mediaserver/metadata \
    /var/lib/mediaserver/profile

RUN addgroup -S mediaserver && adduser -S -u 1001 mediaserver mediaserver

# RUN chown mediaserver:mediaserver /opt/mediaserver

# RUN addgroup -S mediaserver && adduser -S mediaserver -G mediaserver

COPY --chown=mediaserver:mediaserver build/mediaserver /opt/mediaserver
RUN chown -R mediaserver:mediaserver /var/lib/mediaserver

USER mediaserver

ENTRYPOINT [ \
    "/opt/mediaserver", \
    "/var/lib/mediaserver/data", \
    "--addr=:9050", \
    "--cache-dir=/var/lib/mediaserver/cache", \
    "--metadata-dir=/var/lib/mediaserver/metadata", \
    "--profile-dir=/var/lib/mediaserver/profile", \
    "--max-concurrent-cpu-jobs=4" \
]
