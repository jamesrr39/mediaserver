package gofs

import (
	"os"
	"path/filepath"
	"sort"

	"github.com/jamesrr39/goutil/excludesmatcher"
)

type WalkOptions struct {
	FollowSymlinks  bool
	ExcludesMatcher excludesmatcher.Matcher
}

func Walk(fs Fs, path string, walkFunc filepath.WalkFunc, options WalkOptions) error {
	isExcluded := options.ExcludesMatcher != nil && options.ExcludesMatcher.Matches(path)
	if isExcluded {
		return nil
	}

	fileInfo, err := fs.Stat(path)
	if err != nil {
		return err
	}

	if fileInfo.IsDir() {
		dirEntryInfos, err := fs.ReadDir(path)
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
		lfileInfo, err := fs.Lstat(path)
		if err != nil {
			return err
		}
		isSymlink := (lfileInfo.Mode()&os.ModeSymlink != 0)
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
