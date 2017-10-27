
const r = require('rethinkdb');
const heuristics = require('./heuristics');
const hash = require('json-hash');
const config = require('./config');
const db = require('./utilities');

function connect() {
  return r.connect({ host: config.ip, port: config.port });
}

/*
getGraphID(pcID, releaseID, connection [,callback])
returns the database uuid for the graph specified by the provided
pathway commons identifier and release version (releaseID).
 
pass releaseID = 'latest' to receive the identifier for the most recent
version of PC.
*/
function getGraphID(pcID, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = db.queryRoot(pcID, releaseID);

  // The result of both of these queries will always be a cursor of length one
  // (once proper databse instantiation is complete)
  // Convert this cursor to an array then grab the first (and only) entries uuid
  var idPromise = queryRoot.run(connection)
    .then((result) => {
      return result.toArray();
    }).catch((e) => {
      throw e;
    }).then((result) => {
      return result[0].graph_id;
    }).catch(() => {
      return null;
    });


  return db.handleResult(idPromise, callback);
}


// ------------------- Get a layout -----------------------
/*
getLayout(pcID, releaseID, connection [,callback]) 
Retrieve the layout and its associated graph from the database for the 
Entry specficed by the tuple of pcID and releaseID.
 
Accepts 'latest' as a valid releaseID
*/
function getGraphAndLayout(pcID, releaseID, connection, callback) {
  // Extract a list of layouts associated with the version from the database
  var layout = getLayout(pcID, releaseID, connection);

  // Extract the graph as well. Maybe this should be its own function
  var graph = getGraph(pcID, releaseID, connection);

  // Package the combined results together to return
  var data = Promise.all([layout, graph])
    .then(([layout, graph]) => {
      return { layout: layout ? layout.positions : null, graph: graph ? graph.graph : null };
    }).catch(() => {
      throw Error('Error: data could not be retrieved');
    });

  // handle callback/promise decision
  return db.handleResult(data, callback);
}

function getLayout(pcID, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = db.queryRoot(pcID, releaseID);


  Promise.resolve(queryRoot.run(connection))
    .then((cursor) => cursor.toArray())
    .then((versionArray) => {
      if (!versionArray.length) {
        let err = new Error('No saved layouts');
        err.status = 'NoLayouts';
        throw err;
      }

      return
    });

  // Extract a list of layouts associated with the version from the database
  var layout = queryRoot
    .run(connection)
    .then((cursor) => {
      return cursor.toArray(); // Convert list of valid versions (should be only 1)
    }).catch((e) => {          // from a cursor to an array
      throw e;
    }).then((versionArray) => {
      if (!versionArray.length) {
        let err = new Error('No saved layouts');
        err.status = 'NoLayouts';
        throw err;
      }
      // join the layouts to their layout ids 
      return r.expr(versionArray[0].layout_ids) // create a rethink expression from list of ids
        .eqJoin((id) => { return id; }, r.db(config.databaseName).table('layout'))
        .zip()
        .pluck('positions') // We're only looking for positions
        .run(connection);
    }).catch((e) => {
      throw e;
    }).then((allSubmissions) => {
      // Run decision making process to amalgamate down to one layout to return
      // currently just returns the most recent submission
      return heuristics.run(allSubmissions);
    }).catch((e) => {
      if (e.status === 'NoLayouts') {
        layout = null;
      } else {
        throw e;
      }
    });


  // handle callback/promise decision
  return db.handleResult(layout, callback);
}

function getGraph(pcID, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = db.queryRoot(pcID, releaseID);

  var graph = queryRoot
    .eqJoin('graph_id', r.db(config.databaseName).table('graph'))
    .zip()
    .pluck('graph')
    .run(connection)
    .then((cursor) => {
      return cursor.toArray();
    }).catch((e) => {
      throw e;
    }).then((array) => {
      return array[0];
    });

  return db.handleResult(graph, callback);
}


module.exports = {
  getLayout,
  getGraph,
  getGraphID,
  getGraphAndLayout,
  connect
};
