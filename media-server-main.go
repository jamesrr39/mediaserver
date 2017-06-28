package main

import (
	"log"
	"mediaserverapp/mediaserver"
	"os"
	"path/filepath"

	"github.com/jamesrr39/goutil/userextra"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

var (
	app              = kingpin.New("Mediaserver", "mediaserver")
	imageRootDirFlag = app.Arg("Image Root Directory", "base directory to look for photos in").Required().String()
	port             = app.Flag("port", "serves up via http on this port").Default("9050").Int()
)

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	fullpath, err := getFullDataPath(*imageRootDirFlag)
	if nil != err {
		log.Fatalln("Couldn't get full path of data directory. Error: " + err.Error())
	}

	mediaServer := mediaserver.NewMediaServer(fullpath)
	log.Printf("attempting to start serving on port %d\n", *port)
	err = mediaServer.ServeHTTP(*port)
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
