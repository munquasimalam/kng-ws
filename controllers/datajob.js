var hdb = require('hdb');
const config = require('./config');
const fs = require('fs');

//logging
const log4js = require('log4js');
log4js.configure({
  appenders: { datajob: { type: 'file', filename: './logs/datajob_ErrorLog.log' } },
  categories: { default: { appenders: ['datajob'], level: 'debug' } }
});
const logger = log4js.getLogger('datajob');

//SapHana  Database connection second
hanaConTo = hdb.createClient(config.hanadbto);
hanaConTo.connect((err) => {
    if (err){
       logger.error(err);    
    }  
    console.log('Connected to SAP HANA DB:',config.hanadbto.database); 
    logger.info('Connected to SAP HANA DB:',config.hanadbto.database);
});


loopInsert();

function loopInsert(){
   //const rootFolder = './data';
   const rootFolder = './sql/data';
   fs.readdir(rootFolder, (err, tableNames) => {
    tableNames.forEach(async (tableName) => {
    await fileReader(rootFolder,tableName);
	 console.log("Table Name:"+tableName);
	  logger.info("Table Name:"+tableName);
    });
  })

}

 function fileReader(rootFolder,tableName){
         fs.readFile(rootFolder+"/"+ tableName,(err,fileData)=> {
		 if(!fileData) return;
        const fileDataArray = fileData.toString().split("\n");
       // const fileDataArray = fileData.toString().split(";");
        fileDataArray.forEach(async(insertQuery)=>{
	    insertQuery =await replaceAll(insertQuery,",,",",null,"); 
		insertQuery = await insertQuery.replace(",,", ",null,"); 
        //insertQuery = await insertQuery.replace("\g", "");
        insertQuery = await insertQuery.replace(",)", ",null)");
	   if(insertQuery){ 		
			  hanaConTo.exec(insertQuery, function (err, affectedRow) {
                 if(err){
                       console.log(err,insertQuery);
                       logger.error(err,insertQuery);
                    } 
                 }); 
               }				 
        });
    });
}

function replaceAll(str, find, replace) {

    if(str!=null){
        return str.replace(new RegExp(find, 'g'), replace);
    }
       
    }




