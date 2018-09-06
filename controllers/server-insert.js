const fs = require('fs');

const config = require('../config/config');

loopInsert();

function loopInsert(){
    config.tables.forEach(tableName=>{
        fileReader(tableName);
    });
}

function fileReader(tableName){
    
    fs.readFile("./csv/"+tableName+".csv",(err,fileData)=> {
        if(!fileData) return;
        const fileDataArray = fileData.toString().split("\n");
        let insertHANAQuery = "";
        
        fileDataArray.forEach((data,index)=>{
            if(index){
                data = data.replace(/'/g, "''");
                data = data.replace(/"/g, "'");
                data = data.replace(/\\'/g, "\"");
                // console.log(data);
                // data = data.replace(/{/g, "'{"); // only for buffer object
                try {
                    insertHANAQuery = insertHANAQuery + "INSERT INTO ECLINIC_KNG." + tableName.toUpperCase()+ " VALUES (" + data +");\n";
                } catch (error) {
                    console.log(tableName,error);
                }
            }    
        });
        // console.log("Completed: ", tableName);
        createFile("D:/alam/SapHana/kng/sql/data/"+ tableName + ".sql", insertHANAQuery)
    });
}

function createFile(path,content){
    fs.writeFile(path,content,(err)=>{
        if(err) console.log("err");

        console.log("file saved at", path);
    });
}


