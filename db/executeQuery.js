function query(query, next){
    if(!query) return next("No query");
    mysqlCon.query(query, (err, result)=>{
        if(err) return next(err);
        return next(null,result);
    })
}

function paramQuery(query, params, next){
    if(!query) return next("No query");
     mysqlCon.query(query, params,(err, result)=>{
        if(err) return next(err);
        return next(null,result);
    })
}

exports.query = query;
exports.paramQuery = paramQuery;



