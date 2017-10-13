/**
    Pathway Commons Central Data Cache

    Pathway Commons Database Creation
    buildDB.js

    Purpose : Creates the tables of the database.

    Requires : A running rethinkdb connection

    Effects : Creates an empty database in rethinkdb.

    Note : None

    TODO: 
    - consider merging this file with createDatabase.js (which populates an empty database) 

    @author Geoff Elder
    @version 1.1 2017/10/10
**/
/*
The purpose of this script is to build the database. This should ideally only be run once to set up
and populate the DB.
*/

const r = require('rethinkdb');

var connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  connection = conn;
  createTables('layouts', [
    'graph',
    'version',
    'layout',
    'layout_cache'
  ], true);
})


function createTables(dbName, table_arr, enable_logs){
  r.dbCreate(dbName).run(connection, function(err,callback){
    if (err) throw err;
    if (enable_logs) console.log('Database '+dbName+' created.');
  });

  for (var i = 0; i < table_arr.length; i++) {
    r.db(dbName).tableCreate(table_arr[i]).run(connection, function(err, result) {
      if (err) throw err;
      
    })
  }
  if (enable_logs) console.log('Tables created.');
  
}