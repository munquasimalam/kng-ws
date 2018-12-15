var hdb = require('hdb');
const config = require('../config/config');
const fs = require('fs');

//logging
const log4js = require('log4js');
log4js.configure({
  appenders: { hanatofile: { type: 'file', filename: './logs/hanatofile_ErrorLog.log' } },
  categories: { default: { appenders: ['hanatofile'], level: 'debug' } }
});
const logger = log4js.getLogger('hanatofile');


//SapHana  Database connection first
hanaConFrom = hdb.createClient(config.hanadbfrom);
hanaConFrom.connect((err) => {
    if (err){
       logger.error(err);    
    } 
    console.log('Connected to SAP HANA DB:',config.hanadbfrom.database); 
    logger.info('Connected to SAP HANA DB:',config.hanadbfrom.database);
});


loopOnTables();

 async function loopOnTables(){
    console.time("Time")
  // let tables =await showTableNames();
  
  // let tables =[{'TABLE_NAME':'SALERETURN_MASTER'},{'TABLE_NAME':'appointments'}, {'TABLE_NAME':'history_master'},{'TABLE_NAME':'TEST_DETAILS'},{'TABLE_NAME':'OFFICE_DETAILS'},{'TABLE_NAME':'HISTORY_ASSIGN'},{'TABLE_NAME':' refer_doctors'},{'TABLE_NAME':'BILL_GENERATED'}];
   let tables =[{'TABLE_NAME':'ATTACHEDDOCUMENTS'},{'TABLE_NAME':'MODULE_PRIVLEGE_GRP'}];
   tables.forEach(async (tableNameObj) => {
     let rows= await getTableData(tableNameObj['TABLE_NAME']);
     createInsertQuery(tableNameObj['TABLE_NAME'],rows);
     });  
    console.timeEnd("Time")
}

 function getTableData(tableName){
    
    return new Promise((resolve,reject)=>{
    hanaConFrom.exec("select * from "+config.hanadbfrom.database.toUpperCase()+"."+tableName.toUpperCase(), function (err, rows) {
         if (err) {
         // return console.error('Execute error:', err);
         logger.error(err);
          return reject(err);
        }
       // console.log('Results:', rows);
        return resolve(rows);
      
      });
    });
}

  function createInsertQuery(tableName, rows){
    let insertHANAQuery = "";
         rows.forEach((row)=>{
         let data =  loopOnColumns(row);
          insertHANAQuery = insertHANAQuery + "INSERT INTO "+ config.hanadbto.database.toUpperCase()+"."+tableName.toUpperCase()+" VALUES " + data +"\n"; 
           });
    createFile("./sql/data/"+ tableName + ".sql",insertHANAQuery);

}

function showTableNames(){
     const query = "SELECT  TABLE_NAME FROM SYS.M_TABLES WHERE SCHEMA_NAME = '" + config.hanadbfrom.database.toUpperCase() + "'   and RECORD_COUNT>0";
     return new Promise((resolve,reject)=>{
        hanaConFrom.exec(query, function (err, rows) {
            console.log("rows:"+rows);
             if (err) {
             // return console.error('Execute error:', err);
             logger.error(err);
              return reject(err);
            }
            //console.log('Results:', rows);
            return resolve(rows);
          
          });
        });
}


function loopOnColumns(row){
    let insertValues = "(";
    // for(col in row){
    //      if(row[col] === null && typeof row[col] === "object" || row[col] === "" && typeof row[col] === "string" || row[col] === undefined && typeof row[col] === "undefined" || row[col] === 0 && typeof row[col] === "number"){
    //         if( row[col] === "" && typeof row[col] === "string" || row[col] === undefined && typeof row[col] === "undefined" ){
    //             row[col]= null;  
    //         }
    //         insertValues = insertValues + row[col] + ","
           
    //     } else {
    //         //insertValues = insertValues + "'"+row[col] + "'," 
    //         insertValues = insertValues + "'" + replaceAll(row[col].toString(),"'", "") + "',"
    //     }
              
    // }

    for(col in row){
        if(row[col] === null){  
         insertValues = insertValues + row[col] + ","     
       } else if(row[col] === "" ){
        row[col]= " ";  
        insertValues = insertValues + "'" + row[col] + "',"    
      }
       else {
            insertValues = insertValues + "'" + replaceAll(row[col].toString().replace(/(\r\n|\n|\r)/gm," "),"'", "") + "',"
        }         
   }
    insertValues=insertValues.substring(0, insertValues.length-1);
    return insertValues + ");"
 }

 function createFile(path,content){
    fs.writeFile(path,content,(err)=>{
        if(err) console.log("err");

        console.log("file saved at", path);
        logger.info("file saved at", path);
    });
}

function replaceAll(str, find, replace) {
    if(str!=null){
        return str.replace(new RegExp(find, 'g'), replace);
    }  
}
 




