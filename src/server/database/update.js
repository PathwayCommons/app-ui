const r = require('rethinkdb');
const uuid = require('uuid/v4');
const hash = require('object-hash');
const db = require('./utilities');
const pcServices = require('../pathway-commons');
const _ = require('lodash');

let config = require('./config');

// isExistingGraph(newGraph, connection) takes a graph object
// and a databse connection and checks the database to see if
// a graph alredy exists in the database.
// Makes use of object-hash to simplify object comparisons.
function isExistingGraph(newGraph, connection) {
  return r.db(config.databaseName)
    .table('graph')
    .filter({ hash: newGraph.hash })
    .run(connection)
    .then((cursor) => {
      return cursor.next();
    }).catch(() => {
      return Promise.resolve(false);
    });
}

// Gets PC2 web service version (the latest release).
// This is called when the version specified for retrieval is 'latest'
function getLatestPCVersion() {
  return pcServices.metadata().then((json) => json.version);
}

// saveGraph(pcID, releaseID, graphID, existingGraph, newGraph,connection)
// update a graph object and a matching version entry in the database with
// the provdied IDs. 
// Existing graph is a flag. If true, only a version entry is created,
// if false, a graph is also created
function saveGraph(pcID, releaseID, graphID, existingGraph, newGraph, connection) {
  if (existingGraph) {
    // create new pointer to existing graph
    return db.insert('version', {
      id: uuid(),
      pc_id: pcID,
      release_id: releaseID,
      graph_id: existingGraph.id,
      layout_ids: existingGraph.layout_ids || [],
      users: []
    },
      config,
      connection);
  } else {
    // create new graph

    return Promise.all([
      db.insert('graph', newGraph, config, connection),
      db.insert('version',
        {
          id: uuid(),
          pc_id: pcID,
          release_id: releaseID,
          graph_id: graphID,
          layout_ids: [],
          users: []
        },
        config,
        connection)
    ]);
  }
}

// updateGraph(pcID, releaseID, cyJson, connection [, callback])
// accepts a pcID and a releaseID and a graph object (cyJson).
// It creates the data in the table so that the graph can be retrieved
// using the key pari (pcID, releaseID)
function updateGraph(pcID, releaseID, cyJson, connection, callback) {
  let graphID = uuid();

  // A graph hash is created for ease of comparison between graphs.
  // Since the nodes are unordered, they must be sorted for the hash
  // to be deterministic
  _.sortBy(cyJson.nodes, node => node.id);

  // The values stored in eaach nodes bbox object were also found 
  // to be random so they are removed to from the object clone to
  // be hashed to guarantee determinstic hashing
  let hashJson = _.cloneDeep(cyJson);
  hashJson.nodes = hashJson.nodes.map((node) => {
    _.unset(node, 'data.bbox');
    return node;
  }
  );

  // Create the newGraph info to added to the database
  let newGraph = {
    id: graphID,
    graph: cyJson,
    hash: hash(hashJson)
  };

  // Determine if the graph already exists (parameter to saveGraph)
  let result = isExistingGraph(newGraph, connection).then((existingGraph) => {
    // Grab the version to be used from Pathway Commons if 'latest' is the specified version
    if (releaseID === 'latest') {
      return getLatestPCVersion().then((versionName) => {
        return saveGraph(pcID, versionName, graphID, existingGraph, newGraph, connection);
      });
      // Otherwise, just save the graph.
    } else {
      return saveGraph(pcID, releaseID, graphID, existingGraph, newGraph, connection);
    }
  });


  return db.handleResult(result, callback);
}

// ----------- Submit a new layout -----------------------
/*
saveLayout(pcID, layout, releaseID, connection [,callback]) 
saves a new layout for the graph version specfied by the given pc id and release id.
 
Accepts 'latest' as a valid releaseID
*/
function saveLayout(pcID, releaseID, layout, userID, connection, callback) {
  // Create the new layout entry in the database
  let layoutID = uuid();

  let result = db.insert('layout',
    {
      id: layoutID,
      positions: layout,
      date_added: r.now()
    }, config, connection)
    .then(() => {
      // Find the related version row and store the layout_id so that it may be accessed.
      return db.queryRoot(pcID, releaseID, config).update(
        function (layout) {
          return {
            layout_ids: layout('layout_ids').append(layoutID),
            users: layout('users').setInsert(userID),
          };
        })
        .run(connection);
    }).catch(() => {
      return Promise.reject(new Error('Failed insertion'));
    });

  return db.handleResult(result, callback);
}

module.exports = {
  setConfig: (conf) => config = conf,
  updateGraph,
  saveLayout
};