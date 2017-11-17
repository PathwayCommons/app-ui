
/*
Ensures an instance of the database exists with correctly defined tables in Rethinkdb.
To be run on server startup.
*/

const r = require('rethinkdb');
const config = require('./config');
const Promise = require('bluebird');
const logger = require('./../logger');
const db = require('./utilities');


// createTable(dbName, tableName, connection)
// Generates a table named tableName in the database dbName
// connnected via connection
function createTable(dbName, tableName, connection) {
  return r.db(dbName).tableCreate(tableName).run(connection);
}

// createTables(dbName, tables, connection)
// Generates the tables described by tables in the database dbName
// connnected via connection
function createTables(dbName, tables, connection) {
  return r.dbCreate(dbName).run(connection).then(() => {
    return Promise.map(tables, function (table) {
      return createTable(dbName, table, connection);
    });
  });
}

// checkTable(tableName)
// checks if database dbName has a table tableName and creates
// the table if it does not exist
function checkTable(dbName, tableName) {
  let connection;
  
  db.connect().then((conn)=>{
    connection = conn;
    return r.db(dbName).tableList().run(connection);
  }).then((tableList)=>{
    if (tableList.indexOf(tableName) < 0){
      return r.db(dbName).tableCreate(tableName).run(connection);
    } else {
      return Promise.resolve(null);
    }
  });
}

// checkTable(tableName)
// checks if database dbName has all the tables list in tables
// and creates any that did not already exist
function checkTables(databaseName, tables) {
  return Promise.map(tables, tableName => {
    return checkTable(databaseName, tableName);
  });
}


// CheckDatbase() guarantees that the database described in ./config
// exists with rethinkdb. It ensures that the database exists and that
// it contains all the correct tables.
function checkDatabase() {
  let connection;
  return db.connect()
    .then((conn) => {
      connection = conn;
      return r.dbList().run(connection);
    })
    .then((dbArray) => {
      if (dbArray.indexOf(config.databaseName) >= 0) {
        // If the database exists, ensure all the corrct tables exist as well.
        return checkTables(config.databaseName, config.tables);
      } else {
        return createTables(config.databaseName, config.tables, connection);
      }
    }).catch((e)=>{
      logger.error(e);
    });
}

module.exports = { checkDatabase };