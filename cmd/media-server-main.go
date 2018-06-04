package main

import (
	"log"
	"mediaserverapp/mediaserver"
	"os"
	"path/filepath"

	"github.com/jamesrr39/goutil/userextra"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

const addrHelp = "Serves up via http on this address. Examples: 'localhost:9050' - serve on 9050 to localhost only. ':9050' serve to everyone on port 9050."

var (
	app                  = kingpin.New("Mediaserver", "mediaserver")
	imageRootDirFlag     = app.Arg("Image Root Directory", "The base directory to look for photos in").Required().String()
	addr                 = app.Flag("addr", addrHelp).Default("localhost:9050").String()
	cacheDir             = app.Flag("cache-dir", "Directory to cache data like picture thumbnails in").Default("~/.cache/github.com/jamesrr39/mediaserver").String()
	metadataDir          = app.Flag("metadata-dir", "Directory to store application data").Default("~/.local/share/github.com/jamesrr39/mediaserver").String()
	maxConcurrentResizes = app.Flag("max-concurrent-resizes", "Maximum amount of concurrent resizes. Turn this down on devices with less memory. Resizes ordered after the limit will be queued.").Default("20").Uint()
)

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	fullpath, err := getFullDataPath(*imageRootDirFlag)
	if nil != err {
		log.Fatalf("Couldn't get full path of data directory. Error: %s\n", err)
	}

	expandedCacheDir, err := userextra.ExpandUser(*cacheDir)
	if nil != err {
		log.Fatalf("Couldn't expand the cache directory path from '%s'. Error: %s\n", *cacheDir, err)
	}

	expandedMetadataDir, err := userextra.ExpandUser(*metadataDir)
	if nil != err {
		log.Fatalf("Couldn't expand the data directory path from '%s'. Error: %s\n", *metadataDir, err)
	}

	mediaServer, err := mediaserver.NewMediaServerAndScan(fullpath, expandedCacheDir, expandedMetadataDir, *maxConcurrentResizes)
	if nil != err {
		log.Fatalf("couldn't create a new media server and scan the pictures directory. Error: %s", err)
	}
	defer mediaServer.Close()

	log.Printf("attempting to start serving on address: '%s'\n", *addr)
	err = mediaServer.ListenAndServe(*addr)
	if nil != err {
		log.Fatalf("Couldn't start HTTP server. Error: %s\n", err)
	}
}

func getFullDataPath(path string) (string, error) {
	expandedPath, err := userextra.ExpandUser(path)
	if nil != err {
		return "", err
	}

	return filepath.Abs(expandedPath)
}
