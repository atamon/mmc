var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    sass = require('gulp-sass'),
    minify = require('gulp-minify-css'),
    gutil = require('gulp-util'),
    prefixer = require('gulp-autoprefixer');

var paths = {
  scss: 'stylesheets/*.scss',
  css: 'public/css',
  scripts: ['client/**/*.js'],
  config: ['./*.json', 'client/**/*.json'],
  gameMain: ['client/game.js'],
  bossMain: ['client/boss.js']
};

var buildCSS = function() {
  return gulp.src(paths.scss)
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(prefixer())
    .pipe(minify({ cache: true }))
    .pipe(gulp.dest(paths.css));
};

var buildJS = function(main) {
  return gulp.src(main)
    .pipe(browserify({
      debug: true
    }))
    .on('error', gutil.log)
    .pipe(gulp.dest('public'));
};

gulp.task('css', buildCSS);
gulp.task('game', buildJS.bind(null, paths.gameMain));
gulp.task('boss', buildJS.bind(null, paths.bossMain));

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.scss, ['css']);
  gulp.watch(paths.scripts, ['game']);
  gulp.watch(paths.scripts, ['boss']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['game', 'css']);
