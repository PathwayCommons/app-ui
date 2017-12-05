
const r = require('rethinkdb');
const heuristics = require('./heuristics');
const db = require('./utilities');
const pcServices = require('./../pathway-commons');
const lazyload = require('../lazyload');
const update = require('./update');

let config = require('./config');

// ------------------- Get a layout -----------------------
/*
getLayout(pcID, releaseID, connection [,callback]) 
Retrieves a layout the database for the 
Entry specficed by the tuple of pcID and releaseID.
 
Accepts 'latest' as a valid releaseID
*/
function getLayout(pcID, releaseID, connection, callback) {
  // Extract a list of layouts associated with the version from the database
  let layout = db.queryRoot(pcID, releaseID,config)
    .run(connection)
    .then((cursor) => {
      return cursor.next(); // Convert list of valid versions (should be only 1)
    }).then((version) => {
      // join the layouts to their layout ids
      return r.expr(version.layout_ids) // create a rethink expression from list of ids
        .eqJoin((id) => { return id; }, r.db(config.databaseName).table('layout'))
        .zip()
        .orderBy(r.asc('date_added'))
        .pluck('positions') // We're only looking for positions
        .run(connection);
    }).then((allSubmissions) => {
      // Run decision making process to amalgamate down to one layout to return
      // currently just returns the most recent submission
      return heuristics.run(allSubmissions);
    }).then((result) => {
      return result.positions;
    });

  // handle callback/promise decision
  return db.handleResult(layout, callback);
}

/*
getGraph(pcID, releaseID, connection [, callback])

Retrieves a graph the database for the 
Entry specficed by the tuple of pcID and releaseID.
 
Accepts 'latest' as a valid releaseID
*/

function getLatestPCVersion(pcID) {
  // Traverse queries to PC2 return the current PC2 version.
  return pcServices.traverse({ format: 'JSON', path: 'Named/name', uri: pcID }).then((json) => {
    return json.version;
  });
}


function getGraph(pcID, releaseID, connection, callback) {
  let latestVersion = getLatestPCVersion(pcID);

  let graph = db.queryRoot(pcID, releaseID, config)
    .eqJoin('graph_id', r.db(config.databaseName).table('graph'))
    .zip()
    .run(connection)
    .then((cursor) => {
      return cursor.next();
    });

  let newerGraph = Promise.all([latestVersion, graph]).then(([version, graph]) => {
    if (version !== graph.release_id) {
      // Get new version. This is the same code as in the fallabck for get graph in the controller.
      return getGraphFromPC(pcID, version, connection);
    } else {
      // Just return the graph
      return graph.graph;
    }
  });

  return db.handleResult(newerGraph, callback);
}

function getGraphFromPC(pcID, releaseID, connection) {
  return lazyload.queryForGraphAndMetadata(pcID)
    .catch(() => {
      return lazyload.queryPC(pcID);
    }).then(result => {
      if (connection && result.pathwayMetadata) {
        update.updateGraph(pcID, releaseID, result, connection);
      }
      return result;
    });
}

module.exports = {
  setConfig: (conf) => config = conf,
  getLayout,
  getGraph,
  getGraphFromPC
};
