var fs = require('fs'),
    express = require('express'),
    orm = require('orm'),
    bodyParser = require('body-parser');


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

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
    console.log('Start new session. Participant: ' + JSON.stringify(req.body.name));

    req.models.participant.create({
        name: req.body.name,
        registred: new Date(),
        preference: req.body.preference
    }, function(err, participant) {
        if (err) throw err;

        // add friends
        var friends = req.body.friends !== undefined ? req.body.friends : [];
        for (var i = 0; i < friends.length; i++)
            friends[i].participant_id = participant.id;

        req.models.friend.create(friends, function(err, fr) {
            if (err) throw err;

            // add interests
            var interests = req.body.interests !== undefined ? req.body.interests : [];
            for (var i = 0; i < interests.length; i++)
                interests[i].participant_id = participant.id;

            req.models.interest.create(interests, function(err, ints) {
                if (err) throw err;

                res.send(JSON.stringify({ participantId: participant.id }));
            });
        });
    });
});

app.get("/next", function(req, res) {
    console.log('Request new card. Gender: ' + req.query.gender);

    res.setHeader('Content-Type', 'application/json');

    req.models.participant.get(req.query.sessionId, function(err, participant) {
        if (err) throw err;

        var profileFilter = {};
        if (participant.preference)
            profileFilter.gender = participant.preference;

        var visitedProfileIds = [];
        var visitedProfiles = participant.shows;
        if (visitedProfiles !== undefined && visitedProfiles.length) {
            for (var i = 0; i < visitedProfiles.length; i++)
                visitedProfileIds.push(visitedProfiles[i].profile_id);
            profileFilter.id = orm.not_in(visitedProfileIds);
        }

        // choose not visited profiles + gender filter
        req.models.profile.find(profileFilter, function(err, profiles) {
            if (err) throw err;

            if (profiles.length == 0) {
                res.send(JSON.stringify({ end: true }));
                return;
            }

            var profile = profiles[Math.floor(profiles.length * Math.random())];

            participant.getInterests(function(err, interests) {
                if (err) throw err;

                // select some of interests
                var r = Math.random();
                var interestsCount = r > .4 ? Math.round((r * r * r) * 5) : 0;
                interests = shuffle(interests).slice(0, interestsCount);

                participant.getFriends(function(err, friends) {
                    if (err) throw err;

                    // select some of friends
                    var r = Math.random();
                    var friendsCount = 0;
                    if (r > .9)
                        friendsCount = 3;
                    else if (r > .8)
                        friendsCount = 2;
                    else if (r > .7)
                        friendsCount = 1;
                    friends = shuffle(friends).slice(0, friendsCount);

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

                            if (interests.length > 0 && friends.length > 0)
                                show.addInterests(interests, function(err, ints) {
                                    if (err) throw err;

                                    show.addFriends(friends, function(err, frnds) {
                                        if (err) throw err;

                                        res.send(JSON.stringify(data));
                                    });
                                });
                            else if (interests.length > 0)
                                show.addInterests(interests, function(err, ints) {
                                    if (err) throw err;

                                    res.send(JSON.stringify(data));
                                });
                            else if (friends.length > 0)
                                show.addFriends(friends, function(err, frnds) {
                                    if (err) throw err;

                                    res.send(JSON.stringify(data));
                                });
                            else
                                res.send(JSON.stringify(data));
                        });
                    });
                });
            });
        });
    });
});


app.post("/action", function(req, res) {
    console.log('New action: ' + JSON.stringify(req.body));

    req.models.show.find({ participant_id: req.body.sessionId, profile_id: req.body.targetId }, function(err, shows) {
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

app.post("/emotion", function(req, res) {
    console.log('New emotion: ' + JSON.stringify(req.body));

    req.models.show.find({ start: orm.ne(null), finish: null }, [ 'id', 'Z' ], 1, function(err, shows) {
        if (err) throw err;

        if (shows.length == 0) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Cannot find a show');
        }
        else {
            var show = shows[0];

            var data = [{
                time: new Date(),
                show_id: show.id,
                type: "req.body.type",
                param1: "req.body.param1",
                param2: "req.body.param2",
            }];

            req.models.emotion.create(
                data,
            function(err) {
                if (err) throw err;

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Emotion recorded');
            });
        }
    });
});


app.listen(8080, function () {
});
