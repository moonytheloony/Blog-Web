var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var es = require('event-stream');
var htmlmin = require('gulp-htmlmin');
var uglify = require('gulp-uglify');

gulp.task('minifyStylesheets', done => {
  es.merge(
    gulp
      .src('static/css/*.css')
      .pipe(cssmin())
      .pipe(gulp.dest('static/css/')),
    gulp
      .src('themes/hugo-phlat-theme/static/css/highlightjs-themes/*.css')
      .pipe(cssmin())
      .pipe(gulp.dest('static/css/highlightjs-themes/')),
    gulp
      .src('themes/hugo-phlat-theme/static/css/phlat.css')
      .pipe(cssmin())
      .pipe(gulp.dest('static/css/'))
  );
  done();
});

gulp.task('minifyHtml', function() {
  return gulp
    .src('public/**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('public'));
});

gulp.task('minifyScripts', done => {
  es.merge(
    gulp
      .src('static/js/*.js')
      .pipe(uglify())
      .pipe(gulp.dest('static/js/')),
    gulp
      .src('themes/hugo-phlat-theme/static/js/*.js')
      .pipe(uglify())
      .pipe(gulp.dest('static/js/'))
  );
  done();
});
