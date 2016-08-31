var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var es = require('event-stream');
var htmlmin = require('gulp-htmlmin');
gulp.task('default', function() {
	return es.merge(
		gulp.src('expanded/css/*.css').pipe(cssmin()).pipe(rename({suffix: '.min'})).pipe(gulp.dest('static/css/')),
		gulp.src('themes/hugo-phlat-theme/static/css/highlightjs-themes/*.css').pipe(cssmin()).pipe(gulp.dest('static/css/highlightjs-themes/')),
		gulp.src('themes/hugo-phlat-theme/static/css/phlat.css').pipe(cssmin()).pipe(rename({suffix: '.min'})).pipe(gulp.dest('static/css/')),
		gulp.src('public/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('public')));
});