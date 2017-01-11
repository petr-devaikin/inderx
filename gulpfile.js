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
    if (fs.existsSync('db.sqlite'))
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
                var profiles = [];
                var content = fs.readFileSync("grab/men.json");
                var men = JSON.parse(content);
                content = fs.readFileSync("grab/women.json");
                men = men.concat(JSON.parse(content));
                for (var i = 0; i < men.length; i++) {
                    var u = men[i];
                    profiles.push({
                        iid: u.id,
                        gender: u.gender,
                        name: u.name,
                        age: u.age,
                        desc: u.desc,
                        distance: Math.round(u.distance),
                        info: u.info,
                    });
                }

                Profile.create(profiles, function(err, prfls) {
                    if (err) throw err;

                    var pictures = [];

                    for (var j = 0; j < prfls.length; j++) {
                        var p = men.find(function(a) { return a.id == prfls[j].iid});
                        for (var k = 0; k < p.photos.length; k++) {
                            var url = p.photos[k].split('/');
                            url = url[3] + '_'+ url[4];
                            pictures.push({
                                url: url,
                                profile_id: prfls[j].id
                            });
                        }
                    }

                    Picture.create(pictures, function(err) {
                        if (err) throw err;
                    });
                });
                /*, function(user) {
                        return function(err, profile) {
                            if (err) throw err;

                            for (var j = 0; j < user.photos.length; j++) {
                                var img = user.photos[j].split('/');
                                img = img[3] + '_'+ img[4];
                                Picture.create({
                                        url: img,
                                    }, function(err, picture) {
                                        if (err) throw err;
                                        //console.log(picture.id);
                                });
                            }


                        }
                    }(u)
                    );
                }*/
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
