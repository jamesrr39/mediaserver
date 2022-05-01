#!/bin/bash

set -e

# clean workspace
mkdir -p dist
rm -rf dist/*

# copy HTML index page, bootstrap CSS, and other static resources
cp public/index.html dist/index.html
# cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/
# cp -r node_modules/bootstrap-icons dist/

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

# esbuild the JS bundle
esbuild src/index.tsx \
    --loader:.png=dataurl \
    --watch \
    --bundle \
    --outfile=dist/main.js
