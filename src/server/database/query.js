
const r = require('rethinkdb');
const heuristics = require('./heuristics');
const config = require('./config');
const db = require('./utilities');

function connect() {
  return r.connect({ host: config.ip, port: config.port });
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
  let layout = getLayout(pcID, releaseID, connection);

  // Extract the graph as well. Maybe this should be its own function
  let graph = getGraph(pcID, releaseID, connection);

  // Package the combined results together to return
  let data = Promise.all([layout, graph])
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
  let queryRoot = db.queryRoot(pcID, releaseID);


  // Extract a list of layouts associated with the version from the database
  let layout = queryRoot
    .run(connection)
    .then((cursor) => {
      return cursor.toArray(); // Convert list of valid versions (should be only 1)
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
        .orderBy(r.asc('date_added'))
        .pluck('positions') // We're only looking for positions
        .run(connection);
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
  let queryRoot = db.queryRoot(pcID, releaseID);

  let graph = queryRoot
    .eqJoin('graph_id', r.db(config.databaseName).table('graph'))
    .zip()
    .pluck('graph')
    .run(connection)
    .then((cursor) => {
      return cursor.toArray();
    }).then((array) => {
      if (!array[0]) {
        return Promise.reject(new Error('No available graph'));
      }
      return array[0];
    });
  return db.handleResult(graph, callback);
}


module.exports = {
  getLayout,
  getGraph,
  getGraphAndLayout,
  connect
};
