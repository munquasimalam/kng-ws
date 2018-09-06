const mysql = require('mysql');
const config = require('../config/config');
const fs = require('fs');

const db = mysql.createConnection(config.mysqldb);

db.connect((err)=>{
    if(err) {console.log(err);return;}

    console.log("my sql connection established");
});

init();

function init(){
    console.time("Time")
    config.tables.forEach(tableName=>{
        loopOnTable(tableName);
    });
    console.timeEnd("Time")
}

function loopOnTable(tablename){
    db.query("SHOW COLUMNS FROM eclinic_kng."+ tablename, (err,result)=>{
        if(err) {
            console.log(err);
            return;
        }
        const colums = result.map(col=>{
            return col.Field;
        }).join(",")
        getTableData("SELECT * FROM " + tablename + " LIMIT 20000", tablename, colums);
    });
}

function getTableData(query, tablename, colums){
    db.query(query, (err,result)=>{
        if(err) console.log(err);

        let a1 = result.map(element => {
            return JSON.stringify(Object.values(element));
        }).join('\n') 
        .replace(/(^\[)|(\]$)/mg, ''); 
        
        a1 = colums + '\n' + a1;
        createFile("./csv/"+tablename + ".csv",a1) 
    })
}

function createFile(path,content){
    fs.writeFile(path,content,(err)=>{
        if(err) console.log(err);

        console.log("file saved at", path);
    });
}

