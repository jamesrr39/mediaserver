# Mediaserver

Mediaserver is an application for serving and managing your photos, videos and activity tracks (.gpx and .fit).

The idea is to have a simple-to-run program that will run at home, on a as low-memory as possible Raspberry Pi, so that you can host your photo, videos, and adventure collection.

There are 3 main data stores:

- Data dir: this is where the original image/video/tracks are stored. This directory should be included in any backups.
- Metadata dir: this is where extra data for the application is stored. This is mostly in an embedded database, which contains a mixture of reproduceable and non-reproduceable data; for example, it stores the image sizes and other calculated things, but it also stores user-added things, for example who is in a photo/video. This directory should be included in any backups.
- Cache dir: this is where e.g. thumbnails of images are stored. This directory does not need to be included in backups, as it can be re-created.

## Run

### Development

`make run_dev_server` for the server, and `make run_dev_client` is the easiest way to get started. From there, you can upload photos from the web UI.

You can also put photos in `data/localenv/data` folder. This is especially useful when bulk importing a lot of photos.

### Docker

Docker is nice way to deploy software. There are various targets in the Makefile (e.g. `build_docker_linux_x86_64`) for building a docker image, and a Dockerfile is available in the repository.

If you run in Docker, make sure that you have the data and metadata directories mounted as volumes, and the file/directory owner user IDs are set to be the same between the host computer and the guest container.

## Contributions

Pull requests welcome for small fixes, for features please open an issue to discuss the feature first.
