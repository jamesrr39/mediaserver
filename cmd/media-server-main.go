package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"mediaserverapp/mediaserver"
	"os"
	"path/filepath"
	"time"

	"github.com/jamesrr39/goutil/logger"
	"github.com/jamesrr39/goutil/profile"
	"github.com/jamesrr39/goutil/userextra"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

const addrHelp = "Serves up via http on this address. Examples: 'localhost:9050' - serve on 9050 to localhost only. ':9050' serve to everyone on port 9050."

var (
	app                           = kingpin.New("Mediaserver", "mediaserver")
	imageRootDirFlag              = app.Arg("Image Root Directory", "The base directory to look for photos in").Required().String()
	addr                          = app.Flag("addr", addrHelp).Default("localhost:9050").String()
	cacheDir                      = app.Flag("cache-dir", "Directory to cache data like picture thumbnails in").Default("~/.cache/github.com/jamesrr39/mediaserver").String()
	metadataDir                   = app.Flag("metadata-dir", "Directory to store application data").Default("~/.local/share/github.com/jamesrr39/mediaserver").String()
	maxConcurrentCPUJobs          = app.Flag("max-concurrent-cpu-jobs", "Maximum amount of concurrent CPU jobs to run. Turn this down on devices with less memory. Resizes ordered after the limit will be queued.").Default("4").Uint()
	maxConcurrentVideoConversions = app.Flag("max-concurrent-video-conversions", "Maximum amount of concurrent video conversions. Turn this down on devices with less memory. Conversions ordered after the limit will be queued.").Default("1").Uint()
	profileDir                    = app.Flag("profile-dir", "folder to create a profile file inside").String()
)

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	fullpath, err := getFullDataPath(*imageRootDirFlag)
	if nil != err {
		log.Fatalf("Couldn't get full path of data directory. Error: %s\n", err)
	}

	expandedCacheDir, err := userextra.ExpandUser(*cacheDir)
	if nil != err {
		log.Fatalf("Couldn't expand the cache directory path from %q. Error: %q\n", *cacheDir, err)
	}

	expandedMetadataDir, err := userextra.ExpandUser(*metadataDir)
	if nil != err {
		log.Fatalf("Couldn't expand the data directory path from %q. Error: %q\n", *metadataDir, err)
	}

	profileWriter := ioutil.Discard
	if *profileDir != "" {
		expandedProfileDir, err := userextra.ExpandUser(*profileDir)
		if err != nil {
			log.Fatalf("Couldn't expand the profile directory path from %q. Error: %q\n", *profileDir, err)
		}

		profileFilePath := filepath.Join(expandedProfileDir, fmt.Sprintf("profile_%s.txt", time.Now().Format("2006-01-02_15_04_05")))
		profileWriter, err = os.Create(profileFilePath)
		if err != nil {
			log.Fatalf("Couldn't create profile writer file at %q. Error: %q\n", profileFilePath, err)
		}
	}

	profiler := profile.NewProfiler(profileWriter)

	mediaServer, err := mediaserver.NewMediaServerAndScan(
		logger.NewLogger(os.Stderr, logger.LogLevelInfo),
		fullpath,
		expandedCacheDir,
		expandedMetadataDir,
		*maxConcurrentCPUJobs,
		*maxConcurrentVideoConversions,
		profiler,
	)
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
