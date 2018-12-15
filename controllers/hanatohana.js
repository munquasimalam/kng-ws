var hdb = require('hdb');
const config = require('../config/config');
const fs = require('fs');

//logging
const log4js = require('log4js');
log4js.configure({
  appenders: { hanatohana: { type: 'file', filename: './logs/hanatohana_ErrorLog.log' } },
  categories: { default: { appenders: ['hanatohana'], level: 'debug' } }
});
const logger = log4js.getLogger('hanatohana');


//SapHana  Database connection first
hanaConFrom = hdb.createClient(config.hanadbfrom);
hanaConFrom.connect((err) => {
    if (err){
       logger.error(err);    
    } 
    console.log('Connected to SAP HANA DB:',config.hanadbfrom.database); 
    logger.info('Connected to SAP HANA DB:',config.hanadbfrom.database);
});

//SapHana  Database connection second
hanaConTo = hdb.createClient(config.hanadbto);
hanaConTo.connect((err) => {
    if (err){
       logger.error(err);    
    }  
    console.log('Connected to SAP HANA DB:',config.hanadbto.database); 
    logger.info('Connected to SAP HANA DB:',config.hanadbto.database);
});


init();

function init(){
    console.time("Time")
    config.tables.forEach(tableName=>{
        loopOnTable(tableName);
    });
    console.timeEnd("Time")
}

async function loopOnTable(tablename){
    let rows= await getTableData(tablename);
   // console.log("rows1:"+rows);
    let insertQueries = await createInsertQuery(tablename,rows);
    //console.log("insertQueries2:"+insertQueries[0]);
        InsertData(insertQueries);
  
        
}

 function getTableData(tablename){
    
    return new Promise((resolve,reject)=>{
    hanaConFrom.exec("select * from "+config.hanadbfrom.database.toUpperCase()+"."+tablename.toUpperCase(), function (err, rows) {
         if (err) {
         // return console.error('Execute error:', err);
          return reject(err);
        }
        //console.log('Results:', rows);
        return resolve(rows);
      
      });
    });
}

function createInsertQuery(tablename, rows){
    let insertQueryArr=[];
     return new Promise((resolve,reject)=>{
        rows.forEach((row)=>{
         let data = loopOnColumns(row);
          let insertQuery = "INSERT INTO "+ config.hanadbto.database.toUpperCase()+"."+tablename.toUpperCase()+" VALUES " + data;
          insertQueryArr.push(insertQuery);
            
    });
    return resolve(insertQueryArr);

 });
}

function InsertData(insertQueries){
    for (let i = 0; i < insertQueries.length; i++) {
          hanaConTo.exec(insertQueries[i], function (err, affectedRows) {
        if(err) {
            console.log(err,insertQueries[i]);
            logger.error(err,insertQueries[i]);
        } 
     });
}
}

function loopOnColumns(row){
    let insertValues = "(";
    let index=-1;
    for(col in row){
        index++;
        if(row[col]===null){
            insertValues = insertValues + +row[col] + "," 
        } else {
            insertValues = insertValues + "'"+row[col] + "'," 
        }
              
    }
    insertValues=insertValues.substring(0, insertValues.length-1);
    return insertValues + ");"
 }
 




