package gofs

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
)

type WalkOptions struct {
	FollowSymlinks bool
}

func Walk(fs Fs, path string, walkFunc filepath.WalkFunc, options WalkOptions) error {
	fileInfo, err := fs.Stat(path)
	if err != nil {
		return err
	}

	if fileInfo.IsDir() {
		dirEntryInfos, err := ioutil.ReadDir(path)
		if err != nil {
			return err
		}

		sort.Slice(dirEntryInfos, func(i int, j int) bool {
			return dirEntryInfos[i].Name() > dirEntryInfos[j].Name()
		})

		for _, dirEntryInfo := range dirEntryInfos {
			err = Walk(fs, filepath.Join(path, dirEntryInfo.Name()), walkFunc, options)
			if err != nil {
				return err
			}
		}
	}

	if options.FollowSymlinks {
		isSymlink := (fileInfo.Mode() & os.ModeSymlink) == 1
		if isSymlink {
			linkDest, err := fs.Readlink(path)
			if err != nil {
				return err
			}
			err = Walk(fs, linkDest, walkFunc, options)
			if err != nil {
				return err
			}
		}
	}

	err = walkFunc(path, fileInfo, nil)
	if err != nil {
		return err
	}

	return nil
}
