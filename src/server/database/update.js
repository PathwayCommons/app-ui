const r = require('rethinkdb');
const uuid = require('uuid/v4');
const hash = require('json-hash');
const config = require('./config');
const db = require('./utilities');


function isExistingGraph(newGraph, connection) {
  var graphListProm = r.db(config.databaseName)
    .table('graph')
    .run(connection)
    .then((cursor) => {
      return cursor.toArray();
    });


  return graphListProm.then((graphList) => {
    var numGraphs = graphList.length; // You will be undefined
    var i = 0;

    while (i < numGraphs) {
      if (compareGraphs(newGraph, graphList[i])) {
        return graphList[i].id;
      }
      i++;
    }
    return null;
  });
}

function updateGraph(pcID, releaseID, cyJson, connection, callback) {
  var graphID = uuid();


  var newGraph = {
    id: graphID,
    graph: cyJson,
    hash: hash.digest(cyJson)
  };


  var result = isExistingGraph(newGraph, connection).then((existingGraphID) => {
    if (existingGraphID) {

      // create new pointer to existing graph
      return db.insert('version', { id: uuid(), pc_id: pcID, graph_id: existingGraphID, layout_ids: [] }, connection);
      // TODO: If the releaseid and pcid and graphid are already linked in version, don't create a new object?
      // this would allow an update script to run blindly
    } else {
      // create new graph

      return Promise.all([
        db.insert('graph', newGraph, connection),
        db.insert('version', { id: uuid(), pc_id: pcID, release_id: releaseID, graph_id: graphID, layout_ids: [] }, connection)
      ]);
    }
  }).catch((e) => {
    throw e;
  });


  return db.handleResult(result, callback);
}

// ----------- Submit a new layout -----------------------
/*
saveLayout(pcID, layout, releaseID, connection [,callback]) 
saves a new layout for the graph version specfied by the given pc id and release id.
 
Accepts 'latest' as a valid releaseID
*/
function saveLayout(pcID, layout, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = db.queryRoot(pcID, releaseID);

  // Create the new layout entry in the database
  var layoutID = uuid();
  var result = db.insert('layout', { id: layoutID, positions: layout, date_added: r.now() }, connection)
    .then(() => {
      // Find the related version row and store the layout_id so that it may be accessed.
      queryRoot.update(
        function (layout) {
          return { layout_ids: layout('layout_ids').append(layoutID) };
        })
        .run(connection);
    }).catch(() => {
      throw Error('Failed insertion');
    });

  return db.handleResult(result, callback);
}