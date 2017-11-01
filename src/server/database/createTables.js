
/*
The purpose of this script is to build the database. This should ideally only be run once to set up
and populate the DB.
*/

const r = require('rethinkdb');
const config = require('./config');
const Promise = require('bluebird');
const logger = require('./../logger');

function connect(){
  return r.connect({host: config.ip, port: config.port});
}


function createTable(dbName, tableName, connection) {
  return r.db(dbName).tableCreate(tableName).run(connection);
}

function createTables(dbName, table_arr, connection) {
  return r.dbCreate(dbName).run(connection).then(() => {
    return Promise.map(table_arr, function (table) {
      return createTable(dbName, table, connection);
    });
  });
}

function checkTable(tableName) {
  let connection;
  
  connect().then((conn)=>{
    connection = conn;
    return r.db(config.databaseName).tableList().run(connection);
  }).then((tableList)=>{
    if (tableList.indexOf(tableName) < 0){
      return r.db(config.databaseName).tableCreate(tableName).run(connection);
    } else {
      return Promise.resolve(null);
      //return;
    }
  });
}

function checkTables() {
  return Promise.map(config.tables, tableName => {
    return checkTable(tableName);
  });
}

function checkDatabase() {
  let connection;
  return connect()
    .then((conn) => {
      connection = conn;
      return r.dbList().run(connection);
    })
    .then((dbArray) => {
      if (dbArray.indexOf(config.databaseName) >= 0) {
        // If the database exists, ensure all the corrct tables exist as well.
        return checkTables();
      } else {
        return createTables(config.databaseName, config.tables, connection);
      }
    }).catch((e)=>{
      logger.error(e);
    });
}

module.exports = { checkDatabase };