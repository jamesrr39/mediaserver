package main

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"io"
	"log"
	"mediaserver/mediaserver"
	"mediaserver/mediaserver/dal"
	"os"
	"path/filepath"
	"time"

	"github.com/jamesrr39/goutil/base64x"
	"github.com/jamesrr39/goutil/errorsx"
	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/goutil/logpkg"
	"github.com/jamesrr39/goutil/profile"
	"github.com/jamesrr39/goutil/streamtostorage"
	"github.com/jamesrr39/goutil/userextra"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

const addrHelp = "Serves up via http on this address. Examples: 'localhost:9050' - serve on 9050 to localhost only. ':9050' serve to everyone on port 9050."

var (
	app                              = kingpin.New("Mediaserver", "mediaserver")
	imageRootDirFlag                 = app.Arg("Image Root Directory", "The base directory to look for photos in").Required().String()
	addr                             = app.Flag("addr", addrHelp).Default("localhost:9050").String()
	cacheDir                         = app.Flag("cache-dir", "Directory to cache data like picture thumbnails in").Default("~/.cache/github.com/jamesrr39/mediaserver").String()
	metadataDir                      = app.Flag("metadata-dir", "Directory to store application data").Default("~/.local/share/github.com/jamesrr39/mediaserver").String()
	maxConcurrentCPUJobs             = app.Flag("max-concurrent-cpu-jobs", "Maximum amount of concurrent CPU jobs to run. Turn this down on devices with less memory. Resizes ordered after the limit will be queued.").Default("4").Uint()
	maxConcurrentVideoConversions    = app.Flag("max-concurrent-video-conversions", "Maximum amount of concurrent video conversions. Turn this down on devices with less memory. Conversions ordered after the limit will be queued.").Default("1").Uint()
	maxConcurrentTrackRecordsParsing = app.Flag("max-concurrent-track-records-parsing", "Maximum amount of concurrent track parsing. Turn this down on devices with less memory.").Default("4").Uint()
	maxConcurrentResizes             = app.Flag("max-concurrent-resizes", "Maximum amount of concurrent picture resizes. Turn this down on devices with less memory.").Default("4").Uint()
	profileDir                       = app.Flag("profile-dir", "folder to create a profile file inside").String()
	thumbnailCachePolicyFlag         = app.Flag("thumbnail-cache-policy", "policy for how aggresively to cache thumbnails").Default(thumbnailCachePolicyNameOnDemand).Enum(thumbnailCachePolicyNameOnDemand, thumbnailCachePolicyNameAheadOfTime, thumbnailCachePolicyNameNoSave)
	base64HmacSigningSecret          = app.Flag("base64-hmac-signing-secret", "Base64 encoded HMAC signing secret for JWT tokens. Specify if you want user tokens to be preserved across app restarts. Otherwise it will be auto-generated").Default("").String()
)

const (
	thumbnailCachePolicyNameAheadOfTime = "ahead-of-time"
	thumbnailCachePolicyNameOnDemand    = "on-demand"
	thumbnailCachePolicyNameNoSave      = "no-save"
)

var thumbnailCachePolicyNameMap = map[string]dal.ThumbnailCachePolicy{
	thumbnailCachePolicyNameOnDemand:    dal.ThumbnailCachePolicyOnDemand,
	thumbnailCachePolicyNameAheadOfTime: dal.ThumbnailCachePolicyAheadOfTime,
	thumbnailCachePolicyNameNoSave:      dal.ThumbnailCachePolicyNoSave,
}

func getThumbnailCachePolicy(name string) (dal.ThumbnailCachePolicy, error) {
	policy, ok := thumbnailCachePolicyNameMap[name]
	if !ok {
		return 0, errorsx.Errorf("thumbnail policy not found: %q", name)
	}

	return policy, nil
}

type ProfileWriter struct {
	io.Writer
	io.Closer
}

func getProfileWriter() io.WriteCloser {
	if *profileDir == "" {
		return ProfileWriter{
			io.Discard,
			io.NopCloser(nil),
		}
	}

	expandedProfileDir, err := userextra.ExpandUser(*profileDir)
	if err != nil {
		errorsx.ExitIfErr(errorsx.Errorf("Couldn't expand the profile directory path from %q. Error: %q\n", *profileDir, err))
	}

	profileFilePath := filepath.Join(expandedProfileDir, fmt.Sprintf("profile_%s.pbf", time.Now().Format("2006-01-02_15_04_05")))
	profileFile, err := os.Create(profileFilePath)
	if err != nil {
		errorsx.ExitIfErr(errorsx.Errorf("Couldn't create profile writer file at %q. Error: %q\n", profileFilePath, err))
	}

	profileWriter, err := streamtostorage.NewWriter(profileFile, streamtostorage.MessageSizeBufferLenDefault)
	if err != nil {
		errorsx.ExitIfErr(errorsx.Wrap(err))
	}

	return ProfileWriter{
		profileWriter,
		profileFile,
	}
}

func main() {
	kingpin.MustParse(app.Parse(os.Args[1:]))

	logger := logpkg.NewLogger(os.Stderr, logpkg.LogLevelInfo)

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

	profileWriter := getProfileWriter()
	defer profileWriter.Close()

	profiler := profile.NewProfiler(profileWriter)

	thumbnailCachePolicy, err := getThumbnailCachePolicy(*thumbnailCachePolicyFlag)
	if err != nil {
		log.Fatalf("couldn't figure out the thumbnail cache policy. Error: %q\n", err)
	}
	logger.Info("thumbnail cache policy: %q", thumbnailCachePolicy)

	var hmacSigningSecret []byte
	if *base64HmacSigningSecret != "" {
		logger.Info("using provided HMAC secret")
		hmacSigningSecret, err = base64x.DecodeBase64(bytes.NewBufferString(*base64HmacSigningSecret))
		if err != nil {
			log.Fatalf("couldn't decode HMAC signing secret: %q\n", err)
		}
	} else {
		logger.Info("no HMAC secret supplied; generating our own HMAC signing secret")
		hmacSigningSecret = make([]byte, 32)
		_, err = rand.Read(hmacSigningSecret)
		if err != nil {
			log.Fatalf("couldn't generate HMAC signing secret: %q\n", err)
		}
	}

	mediaServer, err := mediaserver.NewMediaServer(
		logger,
		gofs.NewOsFs(),
		fullpath,
		expandedCacheDir,
		expandedMetadataDir,
		*maxConcurrentCPUJobs,
		*maxConcurrentVideoConversions,
		profiler,
		thumbnailCachePolicy,
		*maxConcurrentTrackRecordsParsing,
		*maxConcurrentResizes,
		hmacSigningSecret,
	)
	if nil != err {
		log.Fatalf("couldn't create a new media server and scan the pictures directory. Error: %s", err)
	}
	defer mediaServer.Close()

	logger.Info("attempting to start serving on address: '%s'\n", *addr)
	err = mediaServer.ListenAndServe(*addr)
	if nil != err {
		log.Fatalf("Couldn't start HTTP server. %s\n", errorsx.ErrWithStack(errorsx.Wrap(err)))
	}
}

func getFullDataPath(path string) (string, error) {
	expandedPath, err := userextra.ExpandUser(path)
	if nil != err {
		return "", errorsx.Wrap(err)
	}

	return filepath.Abs(expandedPath)
}
