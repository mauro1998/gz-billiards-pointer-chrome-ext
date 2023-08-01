const path = require('path');
const fs = require('fs');
const { src, dest, series, parallel } = require('gulp');
const gclean = require('gulp-clean');
const webpack = require('webpack-stream');
const htmlmin = require('gulp-htmlmin');
const sass = require('gulp-sass')(require('sass'));
const cssmin = require('gulp-clean-css');

const root = __dirname;
const from = (pathname = '') => path.join(root, 'src', pathname);
const to = (pathname = '') => path.join(root, 'build', pathname);

function clean() {
  return src(to(), {
    read: false,
    allowEmpty: true,
  }).pipe(gclean());
}

const js = (input, output, filename) =>
  function jsbase() {
    return src(from(input))
      .pipe(
        webpack({
          output: { filename },
          target: 'web',
          mode: 'production',
        })
      )
      .pipe(dest(to(output)));
  };

const html = (input, output) =>
  function htmlbase() {
    return src(from(input))
      .pipe(
        htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
      .pipe(dest(to(output)));
  };

const css = (input, output) =>
  function cssbase() {
    return src(from(input))
      .pipe(sass({ includePaths: ['node_modules'] }))
      .pipe(cssmin())
      .pipe(dest(to(output)));
  };

function icons() {
  return src(from('icons/*.png')).pipe(dest(to('icons/')));
}

function manifest() {
  return src(from('manifest.json')).pipe(dest(to()));
}

function getContentScriptTasks() {
  const contentDir = from('content');
  const dirs = fs.readdirSync(contentDir);

  return dirs
    .map((dirname) => ({ dirpath: path.join(contentDir, dirname), dirname }))
    .filter(({ dirpath }) => fs.lstatSync(dirpath).isDirectory())
    .map(({ dirpath, dirname }) => {
      const files = fs
        .readdirSync(dirpath)
        .map((pathname) => ({
          filepath: path.join(dirpath, pathname),
          filename: pathname,
        }))
        .filter(
          ({ filepath, filename }) =>
            fs.lstatSync(filepath).isFile() &&
            /^\.(html|js|scss)$/.test(path.extname(filename))
        );

      return files.map(({ filepath, filename }) => {
        const input = path.join('content', dirname, filename);
        const output = path.join('content', dirname);

        switch (path.extname(filename)) {
          case '.js':
            return js(input, output, filename);
          case '.html':
            return html(input, output);
          case '.scss':
            return css(input, output);
          default:
            throw `unable to process invalid file "${filepath}"`;
        }
      });
    });
}

const content = parallel(...getContentScriptTasks());

const popup = parallel(
  js('popup/popup.js', 'popup/', 'popup.js'),
  html('popup/popup.html', 'popup/'),
  css('popup/popup.scss', 'popup/')
);

exports.default = series(clean, popup, content, icons, manifest);
