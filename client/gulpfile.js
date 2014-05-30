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
    karma = require('gulp-karma'),
    _ = require('lodash'),
    fs = require('fs'),
    LIVE_RELOAD_PORT = 35740;

var paths = {
  src: {
    index : 'index.tpl.html',
    coffee : 'coffee/**/*.coffee',
    style : 'style/**/*.css',
    vendorScripts : 'vendorScripts',
    vendorStyles : 'vendorStyles',
    templates : 'templates/**/*.tpl.html',
    images : 'img/**/*'
  },
  dest: {
    index : 'index.html',
    indexPath : './',
    js : 'js/**/*.js',
    jsPath : 'js/',
    build : 'build/',
    images : 'build/img'
  }
};

function getTestScripts() {

  var vendorScripts = fs.readFileSync( paths.src.vendorScripts ).toString().split('\n');

  return vendorScripts
    .concat([
      'bower_components/angular-mocks/angular-mocks.js',
      paths.dest.js
    ]);
}

gulp.task('coffee', function() {

  return gulp.src( paths.src.coffee )
    .pipe( coffee({ sourceMap: true }).on('error', gutil.log) )
    .pipe( gulp.dest( paths.dest.jsPath ) );
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

gulp.task('templates', ['coffee'], function() {

  return gulp.src( paths.src.templates )
    .pipe( minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) )
    .pipe( ngHtml2Js({ moduleName: 'appTemplates', prefix: 'templates/' }) )
    .pipe( concat('app/templates.js') )
    .pipe( gulp.dest( paths.dest.jsPath ) );
});

gulp.task('test', ['coffee'], function() {

  return gulp.src( getTestScripts() )
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('clean', function() {
  return gulp.src( paths.dest.build , {read: false} )
    .pipe(clean());
});

gulp.task('compress-images', ['clean'], function() {

  return gulp.src( paths.src.images )
    .pipe( imagemin() )
    .pipe( gulp.dest( paths.dest.images ) );
});

gulp.task('compress-code', ['clean', 'coffee', 'templates', 'html-includes'], function() {

  return gulp.src( paths.dest.index )
    .pipe(usemin({
      css: [ minifyCss(), 'concat', rev() ],
      html: [ minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) ],
      js: [ ngmin(), uglify({ outSourceMap: true }), rev() ]
    }))
    .pipe( gulp.dest( paths.dest.build ) );
});

gulp.task('build', ['clean', 'html-includes', 'templates', 'coffee', 'test', 'compress-images', 'compress-code']);

var livereloadTasks = ['html-includes', 'html-livereload', 'coffee', 'templates'];

gulp.task('default', livereloadTasks, function() {

  var lr = tinylr();
  lr.listen(LIVE_RELOAD_PORT);

  gulp.watch([
    paths.src.index,
    paths.src.coffee,
    paths.src.vendorScripts,
    paths.src.vendorStyles,
    paths.src.templates
  ], livereloadTasks).on('change', function(e) {
    gutil.log('File ' + e.path + ' was ' + e.type + ', building again...');
  });

  gulp.watch([
    paths.dest.index,
    paths.dest.js,
    paths.src.templates,
    paths.src.style
  ]).on('change', _.debounce(function(e) {
    lr.changed({ body: { files: [require('path').relative(__dirname, e.path)] } });
  }, 200));

  gulp.src( getTestScripts() )
    .pipe( karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }) );

});