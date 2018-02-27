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
	app              = kingpin.New("Mediaserver", "mediaserver")
	imageRootDirFlag = app.Arg("Image Root Directory", "The base directory to look for photos in").Required().String()
	addr             = app.Flag("addr", addrHelp).Default("localhost:9050").String()
)

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	fullpath, err := getFullDataPath(*imageRootDirFlag)
	if nil != err {
		log.Fatalln("Couldn't get full path of data directory. Error: " + err.Error())
	}

	mediaServer, err := mediaserver.NewMediaServerAndScan(fullpath)
	if nil != err {
		log.Fatalf("couldn't create a new media server and scan the pictures directory. Error: %s", err)
	}
	log.Printf("attempting to start serving on address: '%s'\n", *addr)
	err = mediaServer.ServeHTTP(*addr)
	if nil != err {
		log.Fatalln("Couldn't start HTTP server. Error: " + err.Error())
	}

}

func getFullDataPath(path string) (string, error) {
	expandedPath, err := userextra.ExpandUser(path)
	if nil != err {
		return "", err
	}

	return filepath.Abs(expandedPath)
}
