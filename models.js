module.exports = function (db, cb) {
    db.define('participant', {
        name : String,
        registred : Date
    });

    db.define('profile', {
        name : String,
        age : Number,
        desc : String,
        info : String,
        distance : Number,
        interests : String
    });

    return cb();
};
