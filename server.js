var fs = require('fs'),
    express = require('express'),
    bodyParser = require('body-parser');

var app = express();

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
    console.log('Request new card. Gender: ' + req.param('gender'));

    res.setHeader('Content-Type', 'application/json');
    var data = {
        id: ++counter,
        photos: [
            ['/s/mattia.jpg','/s/amy.jpeg','/s/mattia.jpg','/s/amy.jpeg'],
            ['/s/amy.jpeg']
        ][Math.floor(Math.random() * 2)],
        name: ['Mattia', 'Helena', 'Olga', 'Tobias', 'Alexander'][Math.floor(Math.random() * 5)],
        desc: ['TU Berlin', ''][Math.floor(Math.random() * 2)],
        distance: 2 + Math.round(Math.random() * 20) + ' kilometers away',
        info: ['', 'bla-bla-bla\nhohoho'][Math.floor(Math.random() * 2)],
        age: Math.round(Math.random() * 20 + 20),
        interests: [[], ['Nina Kravitz', 'Techno'], ['TU Berlin', 'EIT Digital', 'Innovations', 'Startups']][Math.floor(Math.random() * 3)],
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
        ]][Math.floor(Math.random() * 2)]
    };
    res.send(JSON.stringify(data));
});

app.post("/event", function(req, res) {
    console.log(req.body);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got Post Data');
});


app.listen(8080, function () {
});
