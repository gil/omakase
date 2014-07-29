'use strict';

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    plumber = require('gulp-plumber'),
    filter = require('gulp-filter'),
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
    karma = require('karma').server,
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
    index : 'build/index.html',
    indexPath : 'build/',
    js : 'build/js/**/*.js',
    jsPath : 'build/js/',
    build : 'build/',
    images : 'build/img'
  }
};

function getKarmaConf() {

  var karmaConf = require('./karma.conf.js');
  karmaConf({ LOG_INFO : 'info', set : function(config){ karmaConf = config; } });
  var vendorScripts = fs.readFileSync( paths.src.vendorScripts ).toString().split('\n');

  karmaConf = _.extend(karmaConf, {

    files : vendorScripts.concat([
      'bower_components/angular-mocks/angular-mocks.js',
      paths.dest.js
    ])

  });

  return karmaConf;
}

function filterDeleted(renameFunction) {

  renameFunction = renameFunction || function(filePath) { return filePath; };

  return function (file) {

    if( file.event === 'deleted' ) {

      var fileToRemove = renameFunction(file.path);
      gutil.log( 'Removing file : ' + fileToRemove );
      fs.unlink(fileToRemove);
      return false;
    }

    return true;
  };
}

/*******
** BUILD TASKS
***/

function buildCoffee() {
  return gulp.src( paths.src.coffee )
    .pipe( coffee({ sourceMap: true }) )
    .pipe( gulp.dest( paths.dest.jsPath ) );
}
gulp.task('coffee', ['clean'], buildCoffee);

function buildHtmlIncludes() {
  return gulp.src( paths.src.index )
    .pipe( includeSources({ cwd : paths.dest.build }) )
    .pipe( rename('index.html') )
    .pipe( gulp.dest( paths.dest.indexPath ) );
}
gulp.task('html-includes', ['coffee', 'templates'], buildHtmlIncludes);

function buildTemplates() {
  return gulp.src( paths.src.templates )
    .pipe( minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) )
    .pipe( ngHtml2Js({ moduleName: 'appTemplates', prefix: 'templates/' }) )
    .pipe( concat('app/templates.js') )
    .pipe( gulp.dest( paths.dest.jsPath ) );
}
gulp.task('templates', ['clean'], buildTemplates);

function buildTest(done) {
  karma.start( getKarmaConf(), done );
}
gulp.task('test', ['coffee', 'templates'], buildTest);

function buildClean() {
  return gulp.src( paths.dest.build , {read: false} )
    .pipe( clean() );
}
gulp.task('clean', buildClean);

function buildCompressImages() {
  return gulp.src( paths.src.images )
    .pipe( imagemin() )
    .pipe( gulp.dest( paths.dest.images ) );
}
gulp.task('compress-images', ['clean'], buildCompressImages);

function buildCompressCode() {
  return gulp.src( paths.dest.index )
    .pipe(usemin({
      css: [ minifyCss(), 'concat', rev() ],
      html: [ minifyHtml({ empty: true, conditionals: true, spare: true, quotes: true }) ],
      js: [ ngmin(), uglify({ outSourceMap: true }), rev() ]
    }))
    .pipe( gulp.dest( paths.dest.build ) );
}
gulp.task('compress-code', ['clean', 'coffee', 'templates', 'test', 'html-includes'], buildCompressCode);

function buildCleanTemp() {
  return gulp.src( paths.dest.jsPath, {read: false} )
    .pipe( clean() );
}
gulp.task('build', ['clean', 'html-includes', 'templates', 'coffee', 'test', 'compress-images', 'compress-code'], buildCleanTemp);

/*******
** DEV TASKS
***/

gulp.task('dev-html-includes', ['dev-templates'], buildHtmlIncludes);

gulp.task('dev-templates', buildTemplates);

function devHtmlLivereload() {
  return gulp.src( paths.dest.index )
    .pipe( embedlr({ port : LIVE_RELOAD_PORT }) )
    .pipe( gulp.dest( paths.dest.indexPath ) );
}
gulp.task('dev-html-livereload', ['dev-html-includes'], devHtmlLivereload);

var livereloadTasks = ['dev-html-includes', 'dev-html-livereload', 'dev-templates'];

gulp.task('default', livereloadTasks, function() {

  var lr = tinylr();
  lr.listen(LIVE_RELOAD_PORT);

  gulp.watch([
    paths.src.index,
    paths.src.vendorScripts,
    paths.src.vendorStyles,
    paths.src.templates
  ], livereloadTasks).on('change', function(e) {
    gutil.log( gutil.colors.magenta( _.last(e.path.split('/')) ) + ' was changed' );
  });

  watch({ glob: 'coffee/**/*.coffee' })
    .pipe( filter( filterDeleted( function(filePath){
      return filePath.replace(/\/coffee\//g, '/js/').replace(/\.coffee$/, '.js');
    } ) ) )
    .pipe( plumber() )
    .pipe( coffee({ sourceMap: true }) )
    .pipe( gulp.dest('build/js/') );

  _.each(['style', 'img'], function(path) {
    watch({ glob: path + '/**/*' })
      .pipe( filter(filterDeleted( function (filePath) {
        return filePath.replace(/\/client\//, '/client/build/');
      })) )
      .pipe( gulp.dest('build/' + path + '/') );
  });

  gulp.watch('build/**/*').on('change', _.debounce(function(e) {
    lr.changed({ body: { files: [require('path').relative(__dirname, e.path)] } });
  }, 200));

  gulp.watch('build/js/**/*.js').on('change', _.debounce(function() {
    karma.start( getKarmaConf(), function(){ /* Don't stop watching */ } );
  }, 200));

});