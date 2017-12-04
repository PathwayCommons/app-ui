const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const r = require('rethinkdb');
const Promise = require('bluebird');

const query = require('../../../src/server/database/query');
const createDB = require('../../../src/server/database/createTables').checkDatabase;
const mockConfig = require('./mockConfig.js');
let connection = require('./connection');

const mockData = [
  {
    table: 'graph',
    value: {
      id: 1,
      graph: { nodes: [], edges: [] },
      hash: 'fake'
    }
  },
  {
    table: 'version',
    value: {
      id: 1,
      pc_id: 1,
      layout_ids: [1],
      graph_id: 1,
      release_id: 9,
      users: []
    }
  },
  {
    table: 'layout',
    value: {
      id: 1,
      positions: {},
      date_added: 1 // It's a hack ok
    }
  },
  {
    table: 'version',
    value: {
      id: 2,
      pc_id: 2,
      layout_ids: [],
      graph_id: 2,
      release_id: 9,
      users: []
    }
  }];


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

describe('Test query.js', function () {
  before(function () {
    query.setConfig(mockConfig);
    this.timeout(0);
    return createDB(mockConfig);
  });

  beforeEach(function () {
    return createDB(mockConfig)
      .then(() => createMockData(mockData));
  });


  afterEach(function () {
    return clearDB();
  });

  after(function () {
    return connection.get().then(conn => {
      r.dbDrop(mockConfig.databaseName).run(conn);
    });
  });


  describe('getGraph', function () {
    it('Retrieves an existing graph', function () {
      let version = mockData[1].value;
      let graph = mockData[0].value;
      let promise = connection.get().then(conn => {
        return query.getGraph(version.pc_id, version.release_id, conn);
      });

      return expect(promise).to.eventually.deep.equal(graph.graph);
    });

    it('Throws an error when a graph cannot be retrieved', function () {
      let promise = connection.get()
        .then(conn => query.getGraph('fake', 'also fake', conn));

      return expect(promise).to.eventually.be.rejected;
    });

    it('Optionally accepts a callback', function (done) {
      let version = mockData[1].value;
      let graph = mockData[0].value;
      connection.get().then(conn => {
        return query.getGraph(version.pc_id, version.release_id, conn,
          function (result) {
            expect(result).to.deep.equal(graph.graph);
            done();
          });
      });
    });

    it('Fails when a callback is provided and a graph is not found', function (done) {
      connection.get()
        .then(conn => query.getGraph('fake', 'also fake', conn,
          function (result, err) {
            expect(function () { throw err; }).to.throw(Error);
            done();
          }
        ));
    });
  });

  describe('getLayout', function () {
    it('Retrieves an existing layout', function () {
      let version = mockData[1].value;
      let layout = mockData[2].value;
      let promise = connection.get()
        .then(conn => query.getLayout(version.pc_id, version.release_id, conn));

      return expect(promise).to.eventually.deep.equal(layout.positions);
    });

    it('Throws an error when a layout cannot be retrieved', function () {
      let promise = connection.get()
        .then(conn => query.getLayout('fake', 'also fake', conn));

      return expect(promise).to.eventually.be.rejected;
    });

    it('Optionally accepts a callback', function (done) {
      let version = mockData[1].value;
      let layout = mockData[2].value;
      connection.get().then(conn => {
        return query.getLayout(version.pc_id, version.release_id, conn,
          function (result) {
            expect(result).to.deep.equal(layout.positions);
            done();
          });
      });
    });

    it('Fails when a callback is provided and a layout is not found', function (done) {
      connection.get()
        .then(conn => query.getLayout('fake', 'also fake', conn,
          function (result, err) {
            expect(function () { throw err; }).to.throw(Error);
            done();
          }
        ));
    });

    it('Fails when no layouts have been sumbitted', function () {
      let version = mockData[3].value;
      let promise = connection.get()
        .then(conn => query.getLayout(version.pc_id, version.release_id, conn));
      
        return expect(promise).to.eventually.be.rejected;
    });
  });
});