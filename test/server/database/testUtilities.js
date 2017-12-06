
const chai = require('chai');
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const r = require('rethinkdb');
const Promise = require('bluebird');
const mockConfig = require('./mockConfig.js');
const utilities = require('../../../src/server/database/utilities');
let connection = require('./connection');
const createDB = require('../../../src/server/database/createTables').checkDatabase;


const mockDataManyVersions = new Array(5);
const mockPcId = 0;

for(let i = 0; i < mockDataManyVersions.length; i++){
  mockDataManyVersions[i] = {
    table: 'version',
    value: {
      id: i+100,
      pc_id: mockPcId,
      release_id: i,
      users: []
    }
  };
}



function clearDB() {
  return connection.get().then(conn => {
    return Promise.map(mockConfig.tables, (table) =>
      r.db(mockConfig.databaseName).table(table).delete().run(conn));
  });
}

function createMockData(data) {
  return connection.get().then(conn => {
    return Promise.map(data, datum => {
      return r.db(mockConfig.databaseName)
        .table(datum.table)
        .insert(datum.value)
        .run(conn);
    });
  });
}


describe('Test queryRoot', function(){
  before(function () {
    this.timeout(0);
    return createDB(mockConfig);
  });

  beforeEach(function () {
    return createDB(mockConfig)
      .then(() => createMockData(mockDataManyVersions));
  });

  afterEach(function () {
    return clearDB();
  });

  after(function () {
    return connection.get().then(conn => {
      r.dbDrop(mockConfig.databaseName).run(conn);
    });
  });

  describe('specific version behaviour', function(){
    it('grabs the version matching pc_id and release_id', function(){
      let prom = connection.get().then(conn =>
        utilities.queryRoot(mockPcId, 1, mockConfig).run(conn)
      ).then(res => res.next());

      expect(prom).to.eventually.eql(mockDataManyVersions[1].value);
    });
  });

  describe('latest version behaviour', function(){
    it('grabs the versions with the highest release_id that match pc_id', function(){
      it('grabs the version matching pc_id and release_id', function(){
        let prom = connection.get().then(conn =>
          utilities.queryRoot(mockPcId, 'latest', mockConfig).run(conn)
        ).then(res => res.next());
  
        expect(prom).to.eventually.eql(mockDataManyVersions[4].value);
      });
    });
  });
});
