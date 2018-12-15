var db_query = require('../db/executeQuery');
var mysql = require('mysql');
var hdb = require('hdb');
mysqlCon="";
hanaCon="";
mysqlDatabase="";
hanaDatabase="";
//logging
const log4js = require('log4js');
log4js.configure({
  appenders: { mysqltohana: { type: 'file', filename: './logs/mysqltohana_ErrorLog.log' } },
  categories: { default: { appenders: ['mysqltohana'], level: 'debug' } }
});
const logger = log4js.getLogger('mysqltohana');

const mySQLParams = {
    SMALLINT:/smallint[(]+[0-9]+[)]/g,
    INT:/int[(]+[0-9]+[)]/g,
    UNASIGNED: /unsigned/g,
    TINYTEXT: /tinytext/g,
    BACKTICKS: /`/g,
    AUTO_INCREMENT: /AUTO_INCREMENT/g,
    TABLE: 'TABLE',
    CHARACTER_SET_LATIN1: /CHARACTER SET latin1/g,
    COLLATE: /COLLATE/g,
    LATIN1_BIN: /latin1_bin/g,
    LONGTEXT: /longtext/g,
    MEDIUMTEXT: /mediumtext/g,
    LONGBLOB: /longblob/g,
    DOUBLE: /double/g,
    BIGINTEGER: /bigint[(]+[0-9]+[)]/g,
    DOUBLE: /double/g,
    TINYINTEGER: /tinyint[(]+[0-9]+[)]/g,
   
}

const hanaSQLParams = {
    SMALLINT:'SMALLINT',
    INTEGER:'INTEGER',
    IDENTITY:"GENERATED BY DEFAULT AS IDENTITY",
    VARCHARTEN: "VARCHAR(10)",
    VARCHARMAX: "VARCHAR(5000)",
    VARCHARMEDIUM: "VARCHAR(2500)",
    COLUMN_TABLE: 'COLUMN TABLE',
    BLOB: 'BLOB',
    DECIMAL: 'DECIMAL',
    BIGINT: 'BIGINT',
    TINYINT: 'TinyINT',
    BLANK: '',
    //custom Type
    TINYTEXT: "VARCHAR(255)",
    LONGTEXT: "BLOB"
   
}

async function getMysqlConnection(connectionParams,next){
    this.mysqlDatabase=connectionParams.db;    
    let dbObject = {
        host:connectionParams.idAddress,
        user:connectionParams.name,
        password:connectionParams.password,
        port :connectionParams.port, //port mysql
        database:connectionParams.db
    }
  
//Mysql  Database connection
mysqlCon = mysql.createConnection(dbObject);
this.mysqlCon=mysqlCon;
mysqlCon.connect((err) => {
    let responseMessage= {
    "taskName":"mysqlConnection"
    };   
    if (err) {
        logger.error(err);
        responseMessage= {
            "errorCode": err.code,
            "errNo": err.errno,
            "taskName":""
        }
        return next(responseMessage);
    } 
    logger.info('Coonected To Mysql DB:',dbObject.database);
      return next(null,responseMessage);
});

}

function getHanaConnection(connectionParams,next){
    this.hanaDatabase=connectionParams.db;
     let dbObject = {
        host:connectionParams.idAddress,
        user:connectionParams.name,
        password:connectionParams.password,
        port :connectionParams.port, 
        database:connectionParams.db
    }

//SapHana  Database connection
 hanaCon = hdb.createClient(dbObject);
 this.hanaCon=hanaCon;
  hanaCon.connect((err) => {
    let responseMessage= {
        "taskName":"hanaConnection"
        };
     if (err){
        logger.error(err);
        responseMessage= {
            "errorCode": err.code,
            "taskName":""  
        }
        return next(responseMessage);
     } 
     logger.info('Connected to SAP HANA DB:',dbObject.database);
       return next(null,responseMessage);
 });

}

function showTableNames(){
    // const query = "select TABLE_NAME from information_schema.tables where table_schema = database() AND TABLE_TYPE != 'VIEW';"
    const query = "SHOW TABLES"
    return new Promise((resolve, reject)=>{
        db_query.query(query,(err,tables)=>{
            if(err) return reject(err.sqlMessage);
            return resolve(tables);
           
        })
    });
}

async function createtables(selectedtableNameObjsAndRemoveExistingFlag,next){
     let responseMessage= {
        "taskName":"createTables"
        };
        tableNameObjs= await selectedtableNameObjsAndRemoveExistingFlag[0];
        isRemoveExistingTables= await selectedtableNameObjsAndRemoveExistingFlag[1];
      await done(tableNameObjs,isRemoveExistingTables,this.hanaDatabase);
       next(null,responseMessage);
     
  
  
}


function dropTable(hanaDatabase,tableName,isRemoveExistingTables, next){
    let query = "DROP TABLE "+ hanaDatabase.toUpperCase()+"."+tableName.toUpperCase();
    if(isRemoveExistingTables){
     hanaCon.exec(query, function (dropErr, affectedRows) {
        if(dropErr) {
            if(dropErr.code===259)  next(); //259 -> invalid table name-> Table not exist in DB
        } else {
            next();
        }
     });
    } else {
        next();
    }
}

function done(selectedtableNameObjs,isRemoveExistingTables,hanaDatabase){
    let failCount=0;
    let successCount=0;
     selectedtableNameObjs.forEach(async (tableObj) => {
       // let createStatement = 'CREATE COLUMN TABLE "' + config.db.database + '"."' + table[columnName] + '" (\n',
        let createStatement = 'CREATE COLUMN TABLE "' + hanaDatabase.toUpperCase() + '"."' + tableObj.itemName.toUpperCase() + '" (\n',
        keys = [];
        try {
            columns = await showTableColumn(tableObj["itemName"]);
          } catch (error) {
            logger.error(error);
          }
        if(Array.isArray(columns)){
               columns.forEach(col=>{
                createStatement = createStatement + hanaColumnDefinition(col).trim() + ',\n';
                keys = checkKey(col.Key,col.Field.toUpperCase(),keys);
            });
              if(keys.length)
                createStatement = createStatement + 'PRIMARY KEY ("' + keys.join("\",\"") +'"),\n';
            createStatement = createStatement.substring(0, createStatement.length - 2) + ");\n";
            dropTable(hanaDatabase,tableObj.itemName.toUpperCase(),isRemoveExistingTables, (err)=>{
                     hanaCon.exec(createStatement, function (createErr) {
                        if (createErr) {
                         failCount++;
                         logger.error("Table creation fail with name : "+tableObj["itemName"]+" FailCount :"+failCount, createErr,createStatement);
                              } else {
                            successCount++;
                            logger.info('Table created with name:',tableObj["itemName"]+" successCount :"+successCount);
                          
                        }
                          
                      });
            })
            
        } 
    });
}

function hanaColumnDefinition(colObj){
    // console.log(col.Field.toUpperCase(), hanaColType(col.Type), checkNotNull(col.Null), defaultValue(col.Default));    
    return '"'+ colObj.Field.toUpperCase() +'" ' 
            + hanaColType(colObj.Type) 
            + checkNotNull(colObj.Null) 
            + checkDefaultValue(colObj.Default, colObj.Type) 
            + checkExtra(colObj.Extra); 
}

function checkKey(key, column, keys){
      switch (key) {
        case "PRI":
            keys.push(column.toString());
            break;
        default:
            break;
    }
     return keys;
}

function checkDefaultValue(defaultV, type){
    if(defaultV){
        if(type.toUpperCase() == "TIMESTAMP" && defaultV == "CURRENT_TIMESTAMP"){
            return "DEFAULT CURRENT_TIMESTAMP ";
        }
        
        else if(type.toUpperCase() == "DATETIME" && defaultV == "CURRENT_TIMESTAMP")
            return "DEFAULT CURRENT_DATE ";

        else if(parseInt(defaultV) || defaultV == "0")
            return "DEFAULT " + defaultV +" "
        else
            return "DEFAULT '" + defaultV +"' "
    }
   
    else
        return " ";
}

function checkExtra(extra){
    let returnExtra = "";
    switch (extra) {
        case "auto_increment":
            returnExtra = hanaSQLParams.IDENTITY;
            break;
        default:
            break;
    }
    return returnExtra;
}

function hanaColType(type){
    type = type.replace(mySQLParams.SMALLINT, hanaSQLParams.SMALLINT);
    type = type.replace(mySQLParams.TINYINTEGER, hanaSQLParams.TINYINT);
    type = type.replace(mySQLParams.BIGINTEGER, hanaSQLParams.BIGINT);
    type = type.replace(mySQLParams.INT, hanaSQLParams.INTEGER);
    type = type.replace(mySQLParams.AUTO_INCREMENT, hanaSQLParams.IDENTITY)
    type = type.replace(mySQLParams.TINYTEXT, hanaSQLParams.TINYTEXT);
    type = type.replace(mySQLParams.LONGTEXT, hanaSQLParams.LONGTEXT);
    type = type.replace(mySQLParams.MEDIUMTEXT, hanaSQLParams.VARCHARMEDIUM);
    type = type.replace(mySQLParams.UNASIGNED, hanaSQLParams.BLANK);
    type = type.replace(mySQLParams.CHARACTER_SET_LATIN1, hanaSQLParams.BLANK);
    type = type.replace(mySQLParams.LATIN1_BIN, hanaSQLParams.BLANK);
    type = type.replace(mySQLParams.COLLATE, hanaSQLParams.BLANK);
    type = type.replace(mySQLParams.LONGBLOB, hanaSQLParams.BLOB);
    type = type.replace(mySQLParams.DOUBLE, hanaSQLParams.DECIMAL);
     return type.toUpperCase() + " ";
}

function checkNotNull(nullCheck){
    return (nullCheck.toUpperCase() == "NO") ? "NOT NULL " : ""
}

 async function showAllMysqlTableNames(next){
    let tables;
    try {
        tables = await showTableNames();
 
    } catch (error) {
        logger.error(error);
        //dbDisconnect();
        //return next(error);
        // LOG ERROR
    }
    return next(null,tables);
}

async function insertDataInTables(reqBody,next){
   let tableNameObjs= await reqBody[0];
   let isRemoveExistingRecords= await reqBody[1];
    let tableCount=0;
    let responseMessage= {
        "taskName":"insertData"
        };
        for (const tableNameObj of tableNameObjs) {
            tableCount++;
         const done = await insertDataInSingleTable(tableNameObj.itemName,this.mysqlDatabase,this.hanaDatabase,isRemoveExistingRecords,tableCount);
        }
       
       await next(null,responseMessage);
     }


  async  function insertDataInSingleTable(tableName,mysqlDatabase,hanaDatabase,isRemoveExistingRecords,tableCount){
         try {
            columns =  await showTableColumn(tableName);
            
            data = await getResult(tableName,mysqlDatabase);
              insertQueries = await createInsertQuery(tableName,columns,data,hanaDatabase);
             executeInsertQuery(hanaDatabase,tableName,insertQueries,isRemoveExistingRecords,tableCount);
         
        } catch (error) {
             logger.error(error);
          }
      return "done";
     
}


function getResult(tableName,mysqlDatabase){
   return new Promise((resolve,reject)=>{
       const selectQuery = "SELECT * FROM "+ mysqlDatabase+"."+ tableName +";";
         db_query.paramQuery(selectQuery,[], function (err, result) {
           if(err) return reject(err.sqlMessage);
            return resolve(result);
       })
   });
}
  function executeInsertQuery(hanaDatabase,tableName,insertQueries,isRemoveExistingRecords,tableCount){
   let failCount=0;
     truncateTable(hanaDatabase,tableName,isRemoveExistingRecords, (err)=>{
        if(!err){
            logger.info("Inserted  data in table :"+tableName+"  TableCount:"+tableCount);
            for (let i = 0; i < insertQueries.length; i++) {
                    hanaCon.exec(insertQueries[i], function (err, affectedRows) {
                    if(err) {
                       failCount++;
                       logger.error("Insert Failed:", err,insertQueries[i]+ " FailCount :"+failCount);
                    } 
                 });
            }

        }   
    })
   }

function truncateTable(hanaDatabase,tableName,isRemoveExistingRecords, next){
    let query = "TRUNCATE TABLE "+ hanaDatabase.toUpperCase()+"."+tableName.toUpperCase();
if(isRemoveExistingRecords){
    hanaCon.exec(query, function (err, affectedRows) {
        if(err) {
            logger.error("Trncate Failed", err, query);
            next(err)
        } else {
            next();
        }
       
     });
} else {
    next();
}
   
}

 function createInsertQuery(tableName,colunms, data,hanaDatabase){
   let insertQueryArr=[];
   return new Promise((resolve,reject)=>{
       data.forEach((row)=>{
       let insertQuery = "INSERT INTO "+ hanaDatabase.toUpperCase()+"."+tableName.toUpperCase()+" VALUES " + loopOnColumns(row,colunms);
        insertQueryArr.push(insertQuery);
           
   });
   return resolve(insertQueryArr);
});
}

function loopOnColumns(row,colunms){
   let insertValues = "(";
   let index=-1;
   for(col in row){
       index++;
        if(colunms[index].Type.startsWith('varchar')) {
       insertValues = insertValues + "'" + replaceAll(row[col],"'", "") + "',"
       insertValues =insertValues.replace("undefined", "null");
       } else if(colunms[index].Type.startsWith('text')) {
        insertValues = insertValues + "'" + replaceAll(row[col],"'", "") + "',"
        insertValues =insertValues.replace("undefined", "null");
       } else if(colunms[index].Type.startsWith('datetime')) {
        insertValues = insertValues + "'"  + formatDateToMMMMYYDD(row[col]) + "',"
        insertValues =insertValues.replace("undefined", "null");
       } else if(colunms[index].Type.startsWith('date')) {
        insertValues = insertValues + "'"  + formatDateToMMMMYYDD(row[col]) + "',"
        insertValues =insertValues.replace("undefined", "null");
        } else if(colunms[index].Type.startsWith('mediumtext')) {
        insertValues = insertValues + "'" + replaceAll(row[col],"'", "") + "',"
        insertValues =insertValues.replace("undefined", "null");
       } else if(colunms[index].Type.startsWith('tinytext')) {
        insertValues = insertValues + "'" + replaceAll(row[col],"'", "") + "',"
        insertValues =insertValues.replace("undefined", "null");
       } else if(colunms[index].Type.startsWith('longtext')) {
        insertValues = insertValues + "'" + replaceAll(row[col],"'", "") + "',"
        insertValues =insertValues.replace("undefined", "null");
       } else {
            insertValues = insertValues + row[col] + ","
            insertValues =insertValues.replace("undefined", "null");
           }
   }

   insertValues=insertValues.substring(0, insertValues.length-1);
   return insertValues + ");"
}

function replaceAll(str, find, replace) {

if(str!=null){
    return str.replace(new RegExp(find, 'g'), replace);
}
   
}

function formatDateToMMMMYYDD(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function showTableColumn(table){
   // const query = "SHOW COLUMNS FROM eclinic_hmc." + table + ";";
   const query = "DESCRIBE " + table + ";";
   return new Promise((resolve,reject)=>{
       db_query.query(query,(err,definition)=>{
             if(err) return reject(err.sqlMessage);
           // console.log(definition);
           return resolve(definition);
       })
   });
}

exports.getMysqlConnection = getMysqlConnection;
exports.getHanaConnection = getHanaConnection;
exports.showAllMysqlTableNames = showAllMysqlTableNames;
exports.createtables = createtables;
exports.insertDataInTables = insertDataInTables;


