module.exports = function (db, cb) {
    var Participant = db.define('participant', {
        name : String,
        registred : Date,
        preference : ['male', 'female'],
    });

    var Friend = db.define('friend', {
        name : String,
        picture : String
    })

    var Interest = db.define('interest', {
        name : String
    })

    Friend.hasOne('participant', Participant, { reverse: 'friends' });
    Interest.hasOne('participant', Participant, { reverse: 'interests' });


    var Profile = db.define('profile', {
        gender : ['male', 'female'],
        name : String,
        age : Number,
        desc : String,
        info : String,
        distance : Number
    });

    var Picture = db.define('picture', {
        url : String
    });

    Picture.hasOne('profile', Profile, { reverse: 'pictures' });


    var Show = db.define('show', {
        result : ['like', 'dislike', 'superlike'],
        start : Date,
        finish : Date
    });

    Show.hasOne('participant', Participant, { reverse: 'shows' });
    Show.hasOne('profile', Profile);
    Show.hasMany('interests', Interest);
    Show.hasMany('friends', Friend);


    var Action = db.define('action', {
        type : String,
        param1 : String,
        param2 : String,
        time: Date
    });

    Action.hasOne('show', Show, { reverse: 'actions '});

    var Emotion = db.define('emotion', {
        type : String,
        param1 : String,
        param2 : String,
        time: Date
    });

    return cb();
};
