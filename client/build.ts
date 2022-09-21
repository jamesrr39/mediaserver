const fs = require("fs");
const path = require("path");

const esbuild = require("esbuild");

let watch = false;
process.argv.forEach((arg) => {
  if (arg === "--watch") {
    watch = true;
  }
});

const startTimeMs = Date.now();

// ensure dist dir
const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// empty dist dir
fs.readdirSync(distDir).forEach((fileName) => {
  const fullPath = path.join(distDir, fileName);
  fs.unlinkSync(fullPath);
});

// copy public files
const publicDir = path.join(__dirname, "public");

fs.readdirSync(publicDir).forEach((fileName) => {
  const srcPath = path.join(publicDir, fileName);
  const destPath = path.join(distDir, fileName);
  fs.copyFileSync(srcPath, destPath);
});

// build CSS and JS

const jsBuild = esbuild.build({
  loader: {
    ".png": "dataurl",
  },
  outfile: "dist/index.js",
  entryPoints: ["src/index.tsx"],
  bundle: true,
  sourcemap: true,
  watch,
});

const cssBuild = esbuild.build({
  loader: {
    ".png": "dataurl",
    ".woff2": "dataurl",
    ".woff": "dataurl",
    ".ttf": "dataurl",
    ".eot": "dataurl",
    ".svg": "dataurl",
  },
  outfile: "dist/index.css",
  entryPoints: ["src/index.css"],
  bundle: true,
  watch,
});

Promise.all([jsBuild, cssBuild]).then(() => {
  const endDateMs = Date.now();
  const durationSeconds = (endDateMs - startTimeMs) / 1000;

  console.log(`build finished in ${durationSeconds}s`);
});
