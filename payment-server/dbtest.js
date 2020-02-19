const mysql = require('mysql');

const config = {
    host: 'localhost',
    user     : 'root',
    password : 'root'
}

var connection = mysql.createConnection(config);

connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
   
    console.log('connected as id ' + connection.threadId);
});

connection.query('CREATE DATABASE IF NOT EXISTS cus;', function (err, res, fields) {
    if(err) throw err;
    console.log("Database created!");
})

connection.query('use cus;', function (err, res, fields) {
    if(err) throw err;
    console.log("using cus!");
})

connection.query('CREATE TABLE IF NOT EXISTS customers (user_name VARCHAR(50) NOT NULL, contact_number VARCHAR(10) \
                 NOT NULL, plan VARCHAR(20) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, trials_left INT DEFAULT 1,\
                 PRIMARY KEY(contact_number)) ;', function (err, res, fields) {
    if(err) throw err;
    console.log("Table created!");
})

connection.query('DESCRIBE customers;', function (err, res, fields) {
    if(err) throw err;
})

connection.end(function(err) {
    // The connection is terminated now
    if(err) throw err;
  });
