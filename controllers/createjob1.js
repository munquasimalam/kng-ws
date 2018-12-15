var hdb = require('hdb');
const config = require('./config');
const fs = require('fs');

//logging
const log4js = require('log4js');
log4js.configure({
    appenders: { createjob1: { type: 'file', filename: './logs/createjob1_ErrorLog.log' } },
    categories: { default: { appenders: ['createjob1'], level: 'debug' } }
});
const logger = log4js.getLogger('createjob1');

//SapHana  Database connection second
hanaConTo = hdb.createClient(config.hanadbto);
hanaConTo.connect((err) => {
    if (err) {
        logger.error(err);
    }
    console.log('Connected to SAP HANA DB:', config.hanadbto.database);
    logger.info('Connected to SAP HANA DB:', config.hanadbto.database);
});


createTableOnHana();


function createTableOnHana() {
    let tableCount = 0;
    //const rootFolder = 'D:/alam/SapHana/kng/sql/create/index/ECLINIC_KNG';
    const rootFolder = './sql/create/index/ECLINIC_HMC_NEW';
    fs.readdir(rootFolder, (err, parentFolders) => {
        parentFolders.forEach(parentFolder => {
            fs.readdir(rootFolder + "/" + parentFolder, (err, childFolders) => {
                childFolders.forEach(childFolder => {
                    fs.readFile(rootFolder + "/" + parentFolder + "/" + childFolder + "/create" + ".sql", 'utf8', (err, fileData) => {
                        if (!fileData) return;
                        fileData = fileData.replace("ECLINIC_HMC_NEW", "ECLINIC_KNG_TEST");
                        hanaConTo.exec(fileData, function (err, affectedRow) {
                            if (err) {
                                console.log(err, fileData);
                                logger.error(err, fileData);
                            }
                            console.log("Table " + childFolder + " Created ");
                            logger.info("Table " + childFolder + " Created   TableCount:" + tableCount++);
                        });

                    });


                });
            });
        });
    })
}



