# container-db-backup-doppler

Docker image packaging [tiredofit/db-backup](https://github.com/tiredofit/docker-db-backup) with [Doppler CLI](https://docs.doppler.com/docs/cli) for secrets injection.

## Versioning

The Docker image version tracks the upstream `tiredofit/db-backup` image version.

For example, `ghcr.io/bylocico/container-db-backup-doppler:4.1.100` contains `tiredofit/db-backup:4.1.100` with the Doppler CLI installed.

A scheduled workflow checks Docker Hub daily for new releases, builds and tests each one, and opens an auto-merge PR.

## Usage

```bash
docker pull ghcr.io/bylocico/container-db-backup-doppler:4.1.100
```

### With Doppler

```bash
docker run \
  -e DOPPLER_TOKEN=dp.st.xxx \
  ghcr.io/bylocico/container-db-backup-doppler:4.1.100
```

### Docker Compose

```yaml
services:
  db-backup:
    image: ghcr.io/bylocico/container-db-backup-doppler:4.1.100
    environment:
      - DOPPLER_TOKEN=${DOPPLER_TOKEN}
```

## How it works

The upstream `tiredofit/db-backup` uses s6-overlay, which must be PID 1. The entrypoint:

1. Checks if Doppler credentials are configured (`DOPPLER_TOKEN`, `DOPPLER_PROJECT`, or `DOPPLER_CONFIG`)
2. If so, downloads secrets from Doppler and exports them as environment variables
3. Execs to `/init` (s6-overlay) which becomes PID 1

This approach avoids wrapping s6-overlay with `doppler run`, which would break PID 1 requirements.

## Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `DOPPLER_TOKEN` | Doppler service token for secrets injection |
| `DOPPLER_PROJECT` | Doppler project name (alternative to token) |
| `DOPPLER_CONFIG` | Doppler config name (alternative to token) |

All upstream `tiredofit/db-backup` environment variables are supported. See the [upstream documentation](https://github.com/tiredofit/docker-db-backup) for backup configuration.

## Development

Build locally:

```bash
docker build -t container-db-backup-doppler .
```

Build a specific upstream version:

```bash
docker build --build-arg DB_BACKUP_VERSION=4.1.99 -t container-db-backup-doppler:4.1.99 .
```

Check for newer upstream versions:

```bash
node scripts/update-version.mjs --list-newer
```

Retarget to a specific version:

```bash
node scripts/update-version.mjs --version 4.1.100
```

## Publishing

Publishing is handled by `.github/workflows/publish.yml`. It runs on published GitHub Releases and on manual workflow dispatch.

The workflow builds multi-arch images (`linux/amd64`, `linux/arm64`) and pushes to GHCR.

## License

MIT
