#!/bin/sh

set -e

# clean workspace
mkdir -p dist
rm -rf dist/*

# copy HTML index page and other static resources
cp public/* dist/

echo 'Start bundling'

CSS_LOADERS="--loader:.png=dataurl --loader:.woff2=dataurl --loader:.woff=dataurl --loader:.ttf=dataurl --loader:.eot=dataurl --loader:.svg=dataurl"
CSS_BUNDLE_CMD="esbuild src/index.css ${CSS_LOADERS} --watch --bundle --outfile=dist/main.css"

JS_BUNDLE_CMD="esbuild src/index.tsx --loader:.png=dataurl --watch --bundle --outfile=dist/main.js"

concurrently "${CSS_BUNDLE_CMD}" "${JS_BUNDLE_CMD}"
