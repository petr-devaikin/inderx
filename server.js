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

var counter = 0;

app.get("/next", function(req, res) {
    console.log('Request new card. Gender: ' + req.params.gender);

    res.setHeader('Content-Type', 'application/json');

    req.models.profile.find(function(err, profiles) {
        var profile = profiles[Math.floor(profiles.length * Math.random())];

        var data = {
            id: profile.id,
            name: profile.name,
            desc: profile.desc,
            distance: profile.distance + ' kilometers away',
            info: profile.info,
            age: profile.age,
            interests: profile.interests.length ? profile.interests.split(',') : [],

            friends: [[], [
                {
                    name: 'Braulio Mattia',
                    image: '/s/mattia.jpg'
                },
                {
                    name: 'Mattia Mattia',
                    image: '/s/amy.jpeg'
                },
                {
                    name: 'Braulio Mattia',
                    image: '/s/mattia.jpg'
                },
                {
                    name: 'Mattia Mattia',
                    image: '/s/mattia.jpg'
                }
            ]][Math.floor(Math.random() * 2)],
            photos: [
                ['/s/mattia.jpg','/s/amy.jpeg','/s/mattia.jpg','/s/amy.jpeg'],
                ['/s/amy.jpeg']
            ][Math.floor(Math.random() * 2)]
        };
        res.send(JSON.stringify(data));
    });
});

app.post("/event", function(req, res) {
    console.log(req.body);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got Post Data');
});


app.listen(8080, function () {
});
