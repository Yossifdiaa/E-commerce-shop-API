const mysql = require("mysql2");

const pool = mysql.createPool({
    host : 'localhost',
    user : 'root' ,
    database : 'soccercorner',
    password : 'Facebook@#$123'
})


module.exports = pool.promise();