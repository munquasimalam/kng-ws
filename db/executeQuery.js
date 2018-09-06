function query(query, next){
    if(!query) return next("No query");
     console.log("query mysqlCon1:"+mysqlCon);
     console.log("*****************query:"+query);
     query
    mysqlCon.query(query, (err, result)=>{
        if(err) return next(err);
        return next(null,result);
    })
}

function paramQuery(query, params, next){
    if(!query) return next("No query");
     console.log(" paramQuery mysqlCon2:"+mysqlCon);
    mysqlCon.query(query, params,(err, result)=>{
        if(err) return next(err);
        return next(null,result);
    })
}

exports.query = query;
exports.paramQuery = paramQuery;



