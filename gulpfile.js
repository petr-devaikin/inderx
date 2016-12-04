var gulp = require('gulp'),
    fs = require('fs'),
    stylus = require('gulp-stylus'),
    nodemon = require('gulp-nodemon'),
    orm = require('orm'),
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


gulp.task('initdb', function () {
    fs.unlinkSync('db.sqlite');

    orm.connect("sqlite://db.sqlite", function (err, db) {
        if (err) throw err;

        db.load('./models', function(err) {
            if (err) throw err;

            var Participant = db.models.participant;
            var Friend = db.models.friend;
            var Interest = db.models.interest;
            var Profile = db.models.profile;
            var Picture = db.models.picture;
            var Show = db.models.show;
            var Action = db.models.action;
            var Emotion = db.models.emotion;

            db.sync(function(err) {
                if (err) throw err;

                // Init data

                for (var i = 1; i < 10; i++) {
                    Profile.create({
                        male: ['male', 'female'][Math.floor(Math.random() * 2)],
                        name: ['Mattia', 'Helena', 'Olga', 'Tobias', 'Alexander'][Math.floor(Math.random() * 5)],
                        age: Math.round(Math.random() * 20 + 20),
                        desc: ['TU Berlin', ''][Math.floor(Math.random() * 2)],
                        distance: 2 + Math.round(Math.random() * 20),
                        info: ['', 'bla-bla-bla\nhohoho'][Math.floor(Math.random() * 2)],
                        //interests: ([[], ['Nina Kravitz', 'Techno'], ['TU Berlin', 'EIT Digital', 'Innovations', 'Startups']][Math.floor(Math.random() * 3)]).join(','),
                    }, function(err, profiles) {
                        if (err) throw err;

                        // add photos
                    });
                }
            });
        });
    });
});


gulp.task('serve', function () {
    var stream = nodemon({
            script: 'server.js',
            ext: 'html js styl png jpeg jpg',
            ignore: ['static/', 'db.sqlite', 'models.js'],
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
