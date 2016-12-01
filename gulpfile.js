var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    nodemon = require('gulp-nodemon'),
    concat = require('gulp-concat');


gulp.task('css', function () {
    gulp.src(['./css/*.styl'])
        .pipe(stylus({ onError: function (e) { console.log(e); } }))
        .pipe(concat('main.css'))
        .pipe(gulp.dest('./static/'));
});


gulp.task('img', function () {
    gulp.src(['./img/*.*'])
        .pipe(gulp.dest('./static/'));
});


gulp.task('js', function () {
    gulp.src(['./js/*.*'])
        .pipe(gulp.dest('./static/'));
});


gulp.task('serve', function () {
    var stream = nodemon({
            script: 'server.js',
            ext: 'html js styl png jpeg jpg',
            ignore: 'static/',
            //watch: ["server.js", "index.html", "css/*.styl", 'img/*', 'js/*'],
            tasks: ['css', 'img', 'js'],
        });

    stream
        .on('restart', function () {
            console.log('restarted!')
        })
        .on('crash', function() {
            console.error('Application has crashed!\n')
                stream.emit('restart', 10)  // restart the server in 10 seconds
        });
});
