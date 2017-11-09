
const r = require('rethinkdb');
const uuid = require('uuid/v4');
const config = require('./config');
const db = require('./utilities');

const dbName = config.databaseName;

function updateFromExisting(version, connection) {
  return r.db(dbName)
    .table('layout')
    .getAll(r.args(version.layout_ids))
    .orderBy(r.desc('date_added'))
    .run(connection)
    .then((cursor) => {
      return cursor.next();
    }).then((latest) => {
      return latest.positions;
    });
}

function addUser(version, userID, connection, callback) {
  return r.db(dbName).table('version').get(version.id).update(() => {
    version.users.push(userID);
    return { users: version.users };
  }).run(connection, callback);
}

function createNewLayout(version, connection) {
  let numLayouts = version.layout_ids.length;

  if (!numLayouts) {
    return Promise.reject(new Error ('ERROR : This should not happen'));
  }

  let layoutID = uuid();

  version.layout_ids.push(layoutID);

  let versionUpdate = r.db(dbName).table('version').get(version.id)
    .update({ layout_ids: version.layout_ids })
    .run(connection);

  let writeLayout = updateFromExisting(version, connection).then((positions) => {
    return db.insert('layout', { id: layoutID, positions: positions, date_added: r.now() }, connection);
  });

  return Promise.all([versionUpdate, writeLayout]);
}

function handleUserInfo(pcID, releaseID, userID, connection, callback) {

  let result = db.queryRoot(pcID, releaseID).run(connection)
    .then((cursor) => {
      return cursor.next();
    }).then((version) => {

      if (version.users.indexOf(userID) >= 0) {
        return Promise.resolve();
      }

      let numUsers = version.users.length;
      let addUserProm = addUser(version, userID, connection);

      if (numUsers) {
        return addUserProm;
      } else {
        let writeLayout = createNewLayout(version, connection);
        return Promise.all([addUserProm, writeLayout]);
      }
    });

  return db.handleResult(result, callback);
}

function updateLayout(pcID, releaseID, diff, connection, callback) {
  let result = db.queryRoot(pcID, releaseID)
    .concatMap(function (version) { return version('layout_ids'); })
    .eqJoin(function (id) { return id; }, r.db(dbName).table('layout'))
    .zip()
    .orderBy(r.desc('date_added'))
    .pluck('id')
    .run(connection)
    .then((cursor) => {
      return cursor.next(); // returns the most recent layout
    }).then((activeLayout) => {
      return r.db(dbName).table('layout').get(activeLayout.id)
        .update({ positions: { [diff.nodeID]: diff.bbox } })
        .run(connection);

    });

  return db.handleResult(result, callback);
}

function saveDiff(pcID, releaseID, diff, userID, connection, callback) {
  return handleUserInfo(pcID, releaseID, userID, connection).then(() => {
    return updateLayout(pcID, releaseID, diff, connection, callback);
  });
}

function popUser(pcID, releaseID, userID, connection, callback) {
  return db.queryRoot(pcID, releaseID).update((row) => {
    return {
      users: row('users').filter(user => user.ne(userID))
    };
  }).run(connection, callback);
}

module.exports = {
  saveDiff,
  popUser
};