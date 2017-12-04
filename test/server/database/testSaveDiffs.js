const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const r = require('rethinkdb');
const Promise = require('bluebird');

const query = require('../../../src/server/database/query');
const update = require('../../../src/server/database/update');
const saveDiffs = require('../../../src/server/database/saveDiffs');
const db = require('../../../src/server/database/utilities');
const createDB = require('../../../src/server/database/createTables').checkDatabase;
const mockConfig = require('./mockConfig.js');
let connection = require('./connection');

const preexisitingUser = 'IAmEditing';
const preexisitingData = [
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
      date_added: r.now(),
      positions: {
        node: { x: 12, y: 12 }
      }
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
      users: [preexisitingUser, preexisitingUser]
    }
  }];

const newPos = { nodeID: 'NewNode', bbox: { x: 420, y: 69 } };
const user = 'fakeUser';

function mergeDiff(layout, diff) {
  layout[diff.nodeID] = diff.bbox;

  return layout;
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

describe('Test saveDiffs.js', function () {
  before(function () {
    this.timeout(0);

    saveDiffs.setConfig(mockConfig);
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
    return connection.get().then(conn => {
      r.dbDrop(mockConfig.databaseName).run(conn);
    });
  });

  describe('saveDiffs', function () {
    it('Modifies the position of specified nodes in a layout', function () {
      const layout = preexisitingData[1].value;
      const version = preexisitingData[0].value;

      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => query.getLayout(version.pc_id, version.release_id, conn));

      return expect(prom).to.eventually.deep.equal(mergeDiff(layout.positions, newPos));
    });

    it('Throws an error if there is no layout to modify', function () {
      const version = preexisitingData[2].value;

      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => query.getLayout(version.pc_id, version.release_id, conn));

      return expect(prom).to.eventually.be.rejected;
    });

    it('Adds the submitter to the list of editors', function () {
      const version = preexisitingData[0].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.users);

      return expect(prom).to.eventually.deep.equal([user]);
    });

    it('Does not duplicate user tags in edit list', function () {
      const version = preexisitingData[0].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn =>
          saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.users);

      return expect(prom).to.eventually.deep.equal([user]);
    });

    it('Creates a new layout if there were previously no active editors', function () {
      const version = preexisitingData[0].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.layout_ids);

      return expect(prom).to.eventually.have.lengthOf(2);
    });

    it('Does not create a layout if there is already an active user', function () {
      const version = preexisitingData[0].value;
      let conn = connection.get();

      let prom = conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn =>
          saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn))
        .then(() => conn)
        .then(conn => r.db(mockConfig.databaseName).table('version').get(version.id).run(conn))
        .then(res => res.layout_ids);

      return expect(prom).to.eventually.have.lengthOf(2);

    });

    it('Optionally accepts a callback', function (done) {
      const layout = preexisitingData[1].value;
      const version = preexisitingData[0].value;

      let conn = connection.get();

      conn.then(conn =>
        saveDiffs.saveDiff(version.pc_id, version.release_id, newPos, user, conn, function () {
          return query.getLayout(version.pc_id, version.release_id, conn, function (res) {
            expect(res).to.deep.equal(mergeDiff(layout.positions, newPos));
            done();
          });
        }));
    });
  });

  describe('popUser', function () {
    it('Removes all user references from the list of active editors for a version', function () {
      const version = preexisitingData[2].value;
      let conn = connection.get();

      let prom = conn
        .then(conn =>
          saveDiffs.popUser(version.pc_id, version.release_id, preexisitingUser, conn))
        .then(() => conn)
        .then(conn =>
          db.queryRoot(version.pc_id, version.release_id, mockConfig)
            .pluck('users').run(conn))
        .then(cursor => cursor.next())
        .then(obj => obj.users);

      return expect(prom).to.eventually.be.an('array').that.does.not.include(preexisitingUser);
    });

    it('Does not fail if the user is not actually an active user', function () {
      const version = preexisitingData[0].value;
      let conn = connection.get();
      let fakeUser = 'NotThere';

      let prom = conn
        .then(conn =>
          saveDiffs.popUser(version.pc_id, version.release_id, fakeUser, conn))
        .then(() => conn)
        .then(conn =>
          db.queryRoot(version.pc_id, version.release_id, mockConfig)
            .pluck('users').run(conn))
        .then(cursor => cursor.next())
        .then(obj => obj.users);

      return expect(prom).to.eventually.be.an('array').that.does.not.include(fakeUser);

    });

    it('optionally accepts a callback', function (done) {
      const version = preexisitingData[2].value;
      let conn = connection.get();

      conn.then(conn =>
        saveDiffs.popUser(version.pc_id, version.release_id, preexisitingUser, conn, function () {
          db.queryRoot(version.pc_id, version.release_id, mockConfig).pluck('users')
            .run(conn, function (err, res) {
              res.next().then(obj => {
                expect(obj.users).to.be.an('array').that.does.not.include(preexisitingUser);
                done();
              });
            });
        })
      );
    });
  });
});