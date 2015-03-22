var gulp = require('gulp');
var mocha = require('gulp-mocha');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var watch = require('gulp-watch');
/*
gulp.task('default', function () {
    return gulp.src('test.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});
*/


gulp.task('scripts', function() {  
    gulp.src('src/client.js')
        .pipe(browserify())
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('public'));

});


gulp.task('clean', function() {
    gulp.src(['public/bundle.js'], {read: false})
        .pipe(clean());
});

gulp.task('default', ['clean'], function() {
    gulp.start('scripts', 'watch');
});

gulp.task('watch', function() {
    gulp.watch(['src/**'], ['scripts']);
});

gulp.task('test', function() {
    return gulp.src('test/test.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

