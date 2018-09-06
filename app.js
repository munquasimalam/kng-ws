var restify = require('restify');
var plugins = require('restify').plugins;
const corsMiddleware = require('restify-cors-middleware')

// var mysql = require('mysql');
// var hdb = require('hdb');


 var config = require('./config/config');

// //Mysql  Database connection
// db = mysql.createConnection(config.mysqldb);
// db.connect((err) => {
//     if (err) {
//         console.log("connection lost: ", err);
//         // throw err;
//     }
//     console.log("mysqldb '", config.mysqldb.database, "' Connected.");
// });




// Hana Database connection
// hanaConn = hdb.createClient(config.hanadb);
// hanaConn.connect((err) => {
//     if (err) {
//         console.log("connection lost: ", err);
//         // throw err;
//     }
//     console.log("hanadb '", config.hanadb.database, "' Connected.");
// });


// server started
var server = restify.createServer({
    name: 'docAPI',
    versions: ['1.0.0', '2.0.0']
});
const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['Authorization'],
    exposeHeaders: ['API-Token-Expiry']
});

server.use(plugins.bodyParser({ mapParams: false })); //for body data
server.use(restify.plugins.queryParser());//for query params 
server.pre(cors.preflight)
server.pre((req, res, next) => {
    let pieces = req.url.replace(/^\/+/, '').split('/');
    let version = pieces[0];
    console.log(version);
    version = version.replace(/v(\d{1})\.(\d{1})\.(\d{1})/, '$1.$2.$3');
    version = version.replace(/v(\d{1})\.(\d{1})/, '$1.$2.0');
    version = version.replace(/v(\d{1})/, '$1.0.0');

    if (server.versions.indexOf(version) > -1) {
        req.url = req.url.replace(pieces[0] + '/', '');
        req.headers = req.headers || [];
        req.headers['accept-version'] = version;
    }
    else if (server.versions.indexOf(version) == -1)
        return res.send(400, { DisplayMessage: "VERSION NOT SUPPORT" });

    return next();
});
server.use(cors.actual);

server.listen(config.port, () => {
    require('./routes')(server);
    console.log("mysql Hana server started on port: ", config.port);
});