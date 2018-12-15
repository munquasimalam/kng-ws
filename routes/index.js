
var mysqlToHana = require('../controllers/mysqlToHana');
module.exports = function (server) {
    //server.use(auth.isAuthenticate);
 
    server.post({ path: '/mysqlconnection', version: '1.0.0' },(req, res, next)=>{ 
        mysqlToHana.getMysqlConnection(req.body,(err,response) => {
            if(err) return res.send(200, {responseMessage:err});
            return res.send(200,{responseMessage:response});
        });
    })

    server.post({ path: '/hanaconnection', version: '1.0.0' },(req, res, next)=>{ 
        mysqlToHana.getHanaConnection(req.body,(err,response) => {
            if(err) return res.send(200, {responseMessage:err});
            return res.send(200,{responseMessage:response});
        });
    })

    server.get('/tablenamelist', (req,res,next) => {
        mysqlToHana.showAllMysqlTableNames((err, response) => {
            if (err) return res.send(500, { ErrorMessage: err});
            return res.send(200, response);
        });
    });
   
    server.post({ path: '/createselectedtables', version: '1.0.0' },(req, res, next)=>{ 
       mysqlToHana.createtables(req.body,(err, response) => {
        if(err) return res.send(200, {responseMessage:err});
        return res.send(200,{responseMessage:response});
        });
    });

     server.post({ path: '/insertdatainselectedtables', version: '1.0.0' },(req, res, next)=>{ 
        mysqlToHana.insertDataInTables(req.body,(err, response) => {
            if(err) return res.send(200, {responseMessage:err});
            return res.send(200,{responseMessage:response});
        });
    });

    


}