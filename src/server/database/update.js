const r = require('rethinkdb');
const uuid = require('uuid/v4');
const hash = require('object-hash');
const config = require('./config');
const db = require('./utilities');
const fetch = require('node-fetch');
const _ = require('lodash');

function isExistingGraph(newGraph, connection) {
  return r.db(config.databaseName)
    .table('graph')
    .filter({ hash: newGraph.hash })
    .run(connection)
    .then((cursor) => {
      return cursor.next();
    }).catch((e) => {
      console.log('no match');
      return Promise.resolve(false);
    });
}

function getLatestPCVersion(pcID){
  const prefix = 'http://www.pathwaycommons.org/pc2/traverse?format=JSON&path=Named/name&uri=';

  let url = prefix + pcID;
  return fetch(url, { method: 'GET'}).then((response) => {
    return response.json();
  }).then((json) => {
    return json.version;
  });
}

function saveGraph(pcID, graphID, releaseID, existingGraph, newGraph,connection){
  if (existingGraph) {
    let existingGraphID = existingGraph.id;
    // create new pointer to existing graph
    return db.insert('version', {
      id: uuid(),
      pc_id: pcID,
      release_id: releaseID,
      graph_id: existingGraphID,
      layout_ids: [],
      users: []
    }, connection);
  } else {
    // create new graph

    return Promise.all([
      db.insert('graph', newGraph, connection),
      db.insert('version', { id: uuid(), pc_id: pcID, release_id: releaseID, graph_id: graphID, layout_ids: [], users: [] }, connection)
    ]);
  }
}

function updateGraph(pcID, releaseID, cyJson, connection, callback) {
  console.log('updating graph');
  let graphID = uuid();

  let nodeSort = (n1, n2) => {
    if (n1.data.id > n2.data.id) return 1;
    if (n1.data.id < n2.data.id) return -1;
    return 0;
  };

  cyJson.nodes.sort(nodeSort);

  let hashJson = _.cloneDeep(cyJson);
  hashJson.nodes = hashJson.nodes.map ((node) => {
    _.unset(node, 'data.bbox');
    return node;}
  );

  let newGraph = {
    id: graphID,
    graph: cyJson,
    hash: hash(hashJson.nodes)
  };

  let result = isExistingGraph(newGraph, connection).then((existingGraph) => {
    if (releaseID === 'latest'){
      return getLatestPCVersion(pcID).then((versionName)=>{
        return saveGraph(pcID, graphID,versionName ,existingGraph,newGraph,connection);
      });
    } else {
      return saveGraph(pcID, graphID, releaseID, existingGraph, newGraph,connection);
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
  let result = db.insert('layout', { id: layoutID, positions: layout, date_added: r.now() }, connection)
    .then(() => {
      // Find the related version row and store the layout_id so that it may be accessed.
      db.queryRoot(pcID, releaseID).update(
        function (layout) {
          return { layout_ids: layout('layout_ids').append(layoutID), users: layout('users').setInsert(userID) };
        })
        .run(connection);
    }).catch(() => {

      throw Error('Failed insertion');
    });

  return db.handleResult(result, callback);
}

module.exports = {
  updateGraph,
  saveLayout
};