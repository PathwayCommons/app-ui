const r = require('rethinkdb');
const { DB_NAME, DB_HOST, DB_PORT, DB_CERT, DB_USER, DB_PASS } = require('../config');
const Promise = require('bluebird');
let fs = require('fs');

let db = {
  connect(){
    if( this.conn ){
      return Promise.resolve( this.conn );
    } else {
      return r.connect({
        host: DB_HOST,
        port: DB_PORT,
        db: DB_NAME,
        user: DB_USER,
        password: DB_PASS,
        ssl: DB_CERT ? {
          ca: fs.readFileSync( DB_CERT )
        } : undefined
      }).then( conn => {
        this.conn = conn;

        return conn;
      } );
    }
  },

  guaranteeTable( tableName ){
    return this.connect().then( () => {
      return this.guaranteeDb();
    }).then( () => {
      return this.db.tableList().run( this.conn );
    } ).then( tables => {
      if( !tables.includes( tableName ) ){
        return this.db.tableCreate( tableName ).run( this.conn );
      } else {
        return Promise.resolve();
      }
    } ).then( () => {
      return this.db.table( tableName );
    } );
  },

  guaranteeDb(){
    if( this.db ){
      return Promise.resolve( this.db );
    }

    return this.connect().then( () => {
      return r.dbList().run( this.conn );
    } ).then( dbs => {
      if( !dbs.includes( DB_NAME ) ){
        return r.dbCreate( DB_NAME ).run( this.conn );
      } else {
        return Promise.resolve();
      }
    } ).then( () => {
      this.db = r.db( DB_NAME );

      return this.db;
    } );
  },

  accessTable( tableName ){
    return this.guaranteeTable( tableName ).then( table => {
      return {
        rethink: r,
        conn: this.conn,
        db: this.db,
        table: table
      };
    } );
  }
};

module.exports = db;