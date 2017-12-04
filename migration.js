var mysql = require('mysql');
var migration = require('mysql-migrations');

var connectionMysql = mysql.createPool({
    connectionLimit : 10,
    host     : 'sql01.michaelminelli.ch',
    user     : 'metalVI',
    password : 'vi2017',
    database : 'hesso_vi'
});

migration.init(connectionMysql, __dirname + '/migrations');
