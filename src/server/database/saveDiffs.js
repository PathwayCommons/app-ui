
const r = require('rethinkdb');
const uuid = require('uuid/v4');
const config = require('./config');
const db = require('./utilities');

const dbName = config.databaseName;

// getLatestPoistions(version, connection) returns the
// most recent position data stored in the database
// for the given version
function getLatestPositions(version, connection) {
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

// addUser(version, userID, connection [, callback])
// adds userID to the list of users for the version specified in the 
// database.
// Optionally returns a promise or executes a callback if one is provided
function addUser(version, userID, connection, callback) {
  return r.db(dbName).table('version').get(version.id).update(() => {
    version.users.push(userID);
    return { users: version.users };
  }).run(connection, callback);
}

// createNewLayout(version, connection) creates a new layout entry in the 
// layout table base on the previous layout for the given version
function createNewLayout(version, connection) {
  let numLayouts = version.layout_ids.length;

  if (!numLayouts) {
    // A layout should be created earlier in the pipeline
    return Promise.reject(new Error ('ERROR : This should not happen'));
  }

  let layoutID = uuid();

  // add new id to list of layout ids
  version.layout_ids.push(layoutID);

  let versionUpdate = r.db(dbName).table('version').get(version.id)
    .update({ layout_ids: version.layout_ids })
    .run(connection);

  // Create the layout entry in the layouts table of the database
  let writeLayout = getLatestPositions(version, connection).then((positions) => {
    // Create a duplicate entry with the most recent poisitions so that the history of the last session
    // remains intact.
    return db.insert('layout', { id: layoutID, positions: positions, date_added: r.now() }, connection);
  });

  return Promise.all([versionUpdate, writeLayout]);
}

// handleUserInfo(pcID, releaseID, userID, connection [, callback])
// adds the userID to the list of active users for the version specified by
// (pcID, releaseID). If there were no previous active users then a new layout
// object is created.
// Optionally returns a promise or executes a callback if one is provided
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


// Update a layout to contain a change in position for a node.
// updateLayout(pcID, releaseID, diff, connection [, callback])
// Applies diff to the layout specified by (pcID, releaseID)
// Returns a promise unless a callback is provided to be executed
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

// saveDiff(pcID, releaseID, diff, userID, connection, callback)
// saves the diff to the layout specified by (pcID, releaseID)
// and stores the ID of the user currently editing the pathway.
// Returns a promise unless a callback is provided to be executed
function saveDiff(pcID, releaseID, diff, userID, connection, callback) {
  // Check if this is a new user submitting a layout and act accordingly.
  return handleUserInfo(pcID, releaseID, userID, connection).then(() => {
    // Once that is dealt with, update the layout to contain the new diff.
    return updateLayout(pcID, releaseID, diff, connection, callback);
  });
}

// Remove a user from the list of active editors for a given version
// popUser(pcID, releaseID, userID, connection [, callback])
// Removes a user from the list of active editors on the pathway
// (pcID, releaseID).
// Returns a promise unless a callback is provided to be executed
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