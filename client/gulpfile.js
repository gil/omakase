'use strict';

var gulp = require('gulp'),
    coffee = require('gulp-coffee'),
    gutil = require('gulp-util'),
    tinylr = require('tiny-lr'),
    embedlr = require('gulp-embedlr'),
    usemin = require('gulp-usemin'),
    ngmin = require('gulp-ngmin'),
    uglify = require('gulp-uglify'),
    minifyHtml = require('gulp-minify-html'),
    minifyCss = require('gulp-minify-css'),
    rev = require('gulp-rev'),
    concat = require('gulp-concat'),
    ngHtml2Js = require('gulp-ng-html2js'),
    imagemin = require('gulp-imagemin'),
    includeSources = require('gulp-include-source'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    _ = require('lodash'),
    LIVE_RELOAD_PORT = 35740;

var paths = {
  src: {
    index : './index.tpl.html',
    baseCoffee : './coffee/*.coffee',
    coffee : './coffee/**/*.coffee',
    styles : './client/style/**/*.css',
    templates : './templates/**/*.tpl.html',
    images : './client/img/**/*'
  },
  dest: {
    index : './index.html',
    indexPath : './',
    scripts : './js'
  },
  jsBuild : './js/**/*'
};

gulp.task('clean', function() {
  return gulp.src('build/*', {read: false})
    .pipe(clean());
});

gulp.task('client-coffee', ['base-coffee'], function() {

  return gulp.src( paths.src.coffee )
    .pipe( coffee({ sourceMap: true }).on('error', gutil.log) )
    .pipe( gulp.dest( paths.dest.scripts ) );
});

gulp.task('base-coffee', function() {

  return gulp.src( paths.src.baseCoffee )
    .pipe( coffee({ sourceMap: true }).on('error', gutil.log) )
    .pipe( gulp.dest( paths.dest.scripts ) );
});

gulp.task('html-includes', function() {

  return gulp.src( paths.src.index )
    .pipe( includeSources() )
    .pipe( rename('index.html') )
    .pipe( gulp.dest( paths.dest.indexPath ) );
});

gulp.task('html-livereload', ['html-includes'], function() {

  return gulp.src( paths.dest.index )
    .pipe( embedlr({ port : LIVE_RELOAD_PORT }) )
    .pipe( gulp.dest( paths.dest.indexPath ) );
});

gulp.task('templates', ['client-coffee'], function() {

  return gulp.src( paths.src.templates )
    .pipe( minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) )
    .pipe( ngHtml2Js({ moduleName: 'appTemplates', prefix: 'templates/' }) )
    .pipe( concat('templates.js') )
    .pipe( gulp.dest( paths.dest.scripts ) );
});

gulp.task('compress-images', function() {

  return gulp.src( paths.src.images )
    .pipe( imagemin() )
    .pipe( gulp.dest('build/img') );
});

gulp.task('compress-code', ['client-coffee', 'templates', 'html-includes'], function() {

  return gulp.src( paths.dest.indexPath )
    .pipe(usemin({
      css: [ minifyCss(), 'concat', rev() ],
      html: [ minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) ],
      js: [ ngmin(), uglify({ outSourceMap: true }), rev() ]
    }))
    .pipe( gulp.dest('build/') );
});

// gulp.task('build', ['clean', 'client-coffee', 'templates', 'compress-images', 'html-includes', 'compress-code']);

gulp.task('default', ['html-includes', 'html-livereload', 'templates', 'client-coffee'], function() {

  var lr = tinylr();
  lr.listen(LIVE_RELOAD_PORT);

  gulp.watch([
    paths.src.index,
    paths.src.coffee,
    paths.src.templates,
    paths.src.images
  ], ['html-includes', 'html-livereload', 'templates', 'client-coffee']).on('change', function(e) {
    gutil.log('File ' + e.path + ' was ' + e.type + ', building again...');
  });

  gulp.watch([
    paths.dest.indexPath,
    paths.jsBuild,
    paths.src.templates,
    paths.src.styles
  ]).on('change', _.debounce(function(e) {
    lr.changed({ body: { files: [require('path').relative(__dirname, e.path)] } });
  }, 200));

});