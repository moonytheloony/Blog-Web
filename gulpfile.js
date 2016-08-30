var gulp = require('gulp')
gulp.task('css', function() {
  gulp.src('static/css/*.css')
    .pipe(gulp.dest('static/css/'))
})

gulp.task('default', ['css'])