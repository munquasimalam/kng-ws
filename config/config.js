module.exports = {
    api_key: "export",
     env: process.env.NODE_ENV || "development",
     port: process.env.PORT || 3000,
     base_url: process.env.BASE_URL || "http://localhost:3000",
    mysqldb:{
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password : process.env.DB_PSW || '',
        port : process.env.DB_PORT || 3306, //port mysql
        database:process.env.DB_NAME || 'eclinic_ghi'
    },
    hanadbfrom:{
        host: process.env.HANA_DB_HOST || '192.168.0.217',
        user: process.env.HANA_DB_USER || 'SYSTEM',
        password : process.env.HANA_DB_PSW || 'Medteam2013',
        port : process.env.HANA_DB_PORT || 39015, 
        database:process.env.HANA_DB_NAME || 'ECLINIC_HMC_NEW'
      
    },
    hanadbto:{
        host: process.env.HANA_DB_HOST || '192.168.0.217',
        user: process.env.HANA_DB_USER || 'SYSTEM',
        password : process.env.HANA_DB_PSW || 'Medteam2013',
        port : process.env.HANA_DB_PORT || 39015, 
        //database:process.env.HANA_DB_NAME || 'ECLINIC_KNG_TEST'
		 database:process.env.HANA_DB_NAME || 'ECLINIC_HMC_NEW'
    },
    tables:['allergies','tooth_code','container_setup']
   
   
}