ARG DB_BACKUP_VERSION=4.1.100
FROM tiredofit/db-backup:${DB_BACKUP_VERSION}

RUN apk add --no-cache curl ca-certificates gnupg && \
    curl -Ls --tlsv1.2 --proto "=https" https://cli.doppler.com/install.sh | sh && \
    rm -rf /var/cache/apk/*

COPY doppler-launch.sh /usr/local/bin/doppler-launch.sh
RUN chmod +x /usr/local/bin/doppler-launch.sh

ENTRYPOINT ["/usr/local/bin/doppler-launch.sh"]
