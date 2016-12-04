var fs = require('fs'),
    express = require('express'),
    orm = require('orm'),
    bodyParser = require('body-parser');

var app = express();

app.use(orm.express("sqlite://db.sqlite", {
    define: function (db, models, next) {
        db.load('./models', function(err) {
            if (err) throw err;

            models.profile = db.models.profile;
            models.participant = db.models.participant;
            models.friend = db.models.friend;
            models.interest = db.models.interest;
            models.profile = db.models.profile;
            models.picture = db.models.picture;
            models.show = db.models.show;
            models.action = db.models.action;
            models.emotion = db.models.emotion;

            next();
        });
        //models.person = db.define("person", { ... });
    }
}));

app.use('/s', express.static('static'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get("/", function(req, res) {
    fs.readFile('index.html',function (err, data){
        res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
        res.write(data);
        res.end();
    });
});


app.post("/session", function(req, res) {
    console.log('Start new session. Participant: ' + JSON.stringify(req.body));

    req.models.participant.create({
        name: req.params.name,
        registeres: new Date(),
        preference: req.body.preference
    }, function(err, participant) {
        if (err) throw err;

        // add friends
        // add interests

        res.send(JSON.stringify({ participantId: participant.id }));
    });
});

app.get("/next", function(req, res) {
    console.log('Request new card. Gender: ' + req.query.gender);

    res.setHeader('Content-Type', 'application/json');

    req.models.profile.find(function(err, profiles) {
        var profile = profiles[Math.floor(profiles.length * Math.random())];

        // choose interests and friends
        var interests = [];
        var friends = [];

        // get photos
        profile.getPictures(function(err, pictures) {
            if (err) throw err;

            var data = {
                id: profile.id,
                name: profile.name,
                desc: profile.desc,
                distance: profile.distance + ' kilometers away',
                info: profile.info,
                age: profile.age,
                interests: interests,
                friends: friends,
                photos: pictures.map(function(p) { return p.url; })
            };

            // create new show
            req.models.show.create({
                participant_id: req.query.sessionId,
                profile_id: profile.id,
            }, function(err, show) {
                if (err) throw err;

                res.send(JSON.stringify(data));
            });
        });
    });
});


app.post("/action", function(req, res) {
    console.log('New action: ' + JSON.stringify(req.body));

    var show = req.models.show.find({ participant_id: req.body.sessionId, profile_id: req.body.targetId }, function(err, shows) {
        if (err) throw err;

        if (shows.length == 0) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Cannot find a show');
        }
        else {
            var show = shows[0];

            if (req.body.type == 'new profile') {
                show.start = new Date();
                show.save(function(err) {
                    if (err) throw err;

                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Show started');
                });
            }
            else if (req.body.type == 'like' || req.body.type == 'dislike' || req.body.type == 'superlike') {
                show.finish = new Date();
                show.result = req.body.type;
                show.save(function(err) {
                    if (err) throw err;

                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Show finished');
                });
            }
            else {
                req.models.action.create({
                    time: new Date(),
                    show_id: show.id,
                    type: req.body.type,
                    param1: req.body.param1,
                    param2: req.body.param2,
                }, function(err) {
                    if (err) throw err;

                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Action recorded');
                });
            }
        }
    });
});


app.listen(8080, function () {
});
