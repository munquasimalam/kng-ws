var hdb = require('hdb');
const config = require('./config');
const fs = require('fs');

//logging
const log4js = require('log4js');
log4js.configure({
  appenders: { createjob2: { type: 'file', filename: './logs/createjob2_ErrorLog.log' } },
  categories: { default: { appenders: ['createjob2'], level: 'debug' } }
});
const logger = log4js.getLogger('createjob2');

//SapHana  Database connection second
hanaConTo = hdb.createClient(config.hanadbto);
hanaConTo.connect((err) => {
    if (err){
       logger.error(err);    
    }  
    console.log('Connected to SAP HANA DB:',config.hanadbto.database); 
    logger.info('Connected to SAP HANA DB:',config.hanadbto.database);
});


createProceduresOnHana();
 

function createProceduresOnHana(){
    //const rootFolder = 'D:/alam/SapHana/kng/sql/create/index/ECLINIC_KNG';
    const rootFolder = './sql/create/export/ECLINIC_HMC_NEW';
   fs.readdir(rootFolder, (err, parentFolders) => {
    parentFolders.forEach(parentFolder => {
    fs.readdir(rootFolder+"/"+parentFolder, (err, childFolders) => {
        childFolders.forEach(childFolder => {
            fs.readFile(rootFolder+"/"+parentFolder+"/"+childFolder+"/create"+".sql",'utf8',(err,fileData)=> {
             if(!fileData) return;
                fileData =replaceAll(fileData,"ECLINIC_HMC_NEW", "ECLINIC_KNG_TEST");
                 hanaConTo.exec(fileData, function (err, affectedRow) {
                    if(err) {
                        console.log(err,fileData);
                        logger.error(err,fileData);
                    } 
                     console.log("Table "+childFolder+" Created   TableCount:"+tableCount++);
                    logger.info("Table "+childFolder+" Created   TableCount:"+tableCount++);
                 });
              
            });


        });
    });
  });
})

}
function replaceAll(str, find, replace) {
    if(str!=null){
        return str.replace(new RegExp(find, 'g'), replace);
    }  
}



