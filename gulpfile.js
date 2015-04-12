var gulp = require('gulp');
var mocha = require('gulp-mocha');
var browserify = require('browserify');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var watch = require('gulp-watch');
var reactify = require('reactify');
var source = require('vinyl-source-stream');

gulp.task('scripts', function() {  
    // Build the game javascript
    browserify('./src/game/client.js')
        .bundle()
        .pipe(source('game_client_bundle.js'))
        .pipe(gulp.dest('public/dist'));

    // Build the backend admin javascript
    browserify('./src/site/backend.jsx',{extensions:['.jsx']})
        .transform(reactify)
        .bundle()
        .pipe(source('backend_bundle.js'))
        .pipe(gulp.dest('public/dist'));
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
