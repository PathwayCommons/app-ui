const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const r = require('rethinkdb');
const Promise = require('bluebird');
const hash = require('object-hash');

const query = require('../../../src/server/database/query');
const update = require('../../../src/server/database/update');
const createDB = require('../../../src/server/database/createTables').checkDatabase;
const mockConfig = require('./mockConfig.js');
let connection = require('./connection');


const preexisitingGraph = {
  nodes: [{ id: 1, info: 'I am fake' }, { id: 2, info: 'me too' }],
  edges: []
};

const preexisitingData = [
  {
    table: 'graph',
    value: {
      id: 1,
      graph: preexisitingGraph,
      hash: hash(preexisitingGraph)
    }
  },
  {
    table: 'version',
    value: {
      id: 1,
      pc_id: 1,
      layout_ids: [],
      graph_id: 1,
      release_id: 9,
      users: []
    }
  }];

const newGraph = {
  nodes: [],
  edges: []
};

const newLayout = { node: 'goesHere' };
const userID = 'FakeUser';

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

describe('Test update.js', function () {
  before(function () {
    this.timeout(0);

    query.setConfig(mockConfig);
    update.setConfig(mockConfig);
    return createDB(mockConfig);
  });

  beforeEach(function () {
    return createMockData(preexisitingData);
  });

  afterEach(function () {
    return clearDB();
  });


  after(function () {
    return connection.get().then(conn => 
      r.dbDrop(mockConfig.databaseName).run(conn)
    );
  });

  describe('updateGraph', function () {

    it('Creates a new Graph', function () {
      let conn = connection.get();
      let prom = conn.then(connection => update.updateGraph(10, 9, newGraph, connection))
        .then(() => conn)
        .then(conn => query.getGraph(10, 9, conn));

      expect(prom).to.eventually.deep.equal(newGraph);
    });


    it('Doesn\'t duplicate graphs', function () {
      let existingG = preexisitingData[0].value.graph;
      const newId = 10, newVersion = 10;
      let conn = connection.get();

      let saveProm = conn.then(connection =>
        update.updateGraph(newId, newVersion, existingG, connection)
      );

      let count = saveProm.then(() => conn).then(conn =>
        r.db(mockConfig.databaseName).table('graph').filter({ hash: hash(existingG) }).count().run(conn));

      let lookup = saveProm.then(() => conn).then((conn) => query.getGraph(newId, newVersion, conn));

      expect(lookup).to.eventually.deep.equal(existingG);
      return expect(count).to.eventually.equal(1);
    });

    it('Optionally accepts a callback', function (done) {
      let conn = connection.get();

      conn.then(connection => update.updateGraph(10, 9, newGraph, connection, function () {
        conn.then(conn => query.getGraph(10, 9, conn, function (res) {
          expect(res).to.deep.equal(newGraph);
          done();
        }));
      }));
    });
  });

  describe('saveLayout', function () {
    const pc_id = 1;
    const version = 9;
    it('stores the new layout', function () {
      let conn = connection.get();

      let prom = conn.then(connection =>
        update.saveLayout(pc_id, version, newLayout, userID, connection))
        .then(() => conn).then(conn => query.getLayout(pc_id, version, conn));

      return expect(prom).to.eventually.deep.equal(newLayout);
    });

    it('optionally accepts a callback', function (done) {
      let conn = connection.get();

      conn.then(connection => update.saveLayout(pc_id, version, newLayout, userID, connection, function () {
        conn.then(conn => query.getLayout(pc_id, version, conn, null, function (res) {
          expect(res).to.deep.equal(newLayout);
          done();
        }));
      }));
    });

    it('Fails if there\'s no associated version entry', function () {
      let conn = connection.get();

      let prom = conn.then(connection =>
        update.saveLayout('fake', 'fake', newLayout, userID, connection))
        .then(() => conn).then(conn => query.getLayout(pc_id, version, conn));

      return expect(prom).to.eventually.be.rejected;
    });

    it('Adds the submitter to the list of editors', function () {
      const version = preexisitingData[1].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        update.saveLayout(version.pc_id, version.release_id, newLayout, userID, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.users);

      return expect(prom).to.eventually.deep.equal([userID]);
    });

    it('Does not duplicate user tags in edit list', function () {
      const version = preexisitingData[1].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        update.saveLayout(version.pc_id, version.release_id, newLayout, userID, conn))
        .then(() => conn)
        .then(conn =>
          update.saveLayout(version.pc_id, version.release_id, newLayout, userID, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.users);

      return expect(prom).to.eventually.deep.equal([userID]);
    });
  });
});