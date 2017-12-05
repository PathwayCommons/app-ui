const chai = require('chai');
const expect = chai.expect;
const r = require('rethinkdb');
const createTables = require('./../../../src/server/database/createTables').checkDatabase;
const CONFIG = require('./mockConfig');

describe('Table creation', function () {
  after(function () {
    return r.connect({ host: 'localhost', port: 28015 }).then(conn => 
       r.dbDrop(CONFIG.databaseName).run(conn)
    );
  });

  this.timeout(0);

  it('Should return 3 resolved promises', function () {
    return createTables(CONFIG).then(res => {
      expect(res).to.have.lengthOf(CONFIG.tables.length);
    });
  });

  it('Should all the config tables specified in the configuration', function () {
    return createTables(CONFIG)
      .then(() => r.connect({ host: 'localhost', port: 28015 }))
      .then(connection => {
        return r.db(CONFIG.databaseName).tableList().run(connection);
      }).then(res => {
        expect(res).to.have.lengthOf(CONFIG.tables.length);
        expect(res.sort()).to.eql(CONFIG.tables.sort());
      });
  });
});



