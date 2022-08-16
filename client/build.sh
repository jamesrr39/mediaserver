#!/bin/sh

set -e

# clean workspace
mkdir -p dist
rm -rf dist/*

# copy HTML index page, bootstrap CSS, and other static resources
cp public/index.html dist/index.html
# cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/
# cp -r node_modules/bootstrap-icons dist/

echo 'Start bundling CSS'

# esbuild the CSS bundle
esbuild src/index.css \
    --loader:.png=dataurl \
    --loader:.woff2=dataurl \
    --loader:.woff=dataurl \
    --loader:.ttf=dataurl \
    --loader:.eot=dataurl \
    --loader:.svg=dataurl \
    --bundle \
    --outfile=dist/main.css

echo 'Finished bundling CSS. Please note, CSS is not "watched" and to re-bundle, you have to run '
echo 'Start bundling js'

# esbuild the JS bundle
esbuild src/index.tsx \
    --loader:.png=dataurl \
    --watch \
    --bundle \
    --outfile=dist/main.js

echo 'Finished bundling js'
