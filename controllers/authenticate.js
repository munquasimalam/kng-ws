
const bcrypt = require('bcrypt')
var config = require('../config/config');

function authenticate(token, res, next) {
    bcrypt.compare(config.api_key, token, function (err, isValid) {
        if (err) return next(err);
        return next(null, isValid)
    })
}

function isAuthenticate(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    // var bearerHeader=generateTocken();
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[0];
        req.token = bearerToken;
        authenticate(req.token, res, (err, isValid) => {
            if (err) return res.send(403, err);
            req.user = isValid;
            if (isValid) {
                return next();
            } else {
                res.send("INVALIDTOKEN");
            }
        })
    } else {
        res.send(403, "NoTOKEN");
    }
}

function generateTocken() {
    var round = 10;
    const salt = bcrypt.genSaltSync(round)
    const token = bcrypt.hashSync("export", salt)
    return token;
}

exports.isAuthenticate = isAuthenticate;
