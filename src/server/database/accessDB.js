/**
    Pathway Commons Central Data Cache

    Pathway Commons Database Interaction Functions
    accessDB.js

    Purpose : Provides functions to read from and write to the database.

    Requires : None

    Effects : None

    Note : None

    TODO: 
    - go over error handling and create meaningful failure messages and mechanisms
    - clean up auxillary test files and move them into mocha/chai
    - add layout cache to database design. Create helper scripts to handle flushing of cache  

    @author Geoff Elder
    @version 1.1 2017/10/10
**/

var dbName = 'layouts';
const r = require('rethinkdb');
const uuid = require('uuid/v4');
const heuristics = require('./heuristics.js');
const hash = require('json-hash');


// Convenience function to create root for common queries depending on whether
// the desired version of PC is 'latest' or an exact version number
function getQueryRoot(pcID, releaseID) {
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).orderBy('release_id').limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  return (releaseID === 'latest') ? latestQuery : specificQuery;
}

// Convenience generic insert function for inserting a json (data)
// into the table specified by table
function insert(table, data, connection, callback) {
  return r.db(dbName).table(table).insert(data).run(connection, callback);
}

// Convenience function to handle the result of an asynchronous call with
// an optional callback and a returned promise if none is given.
function handleResult(resultPromise, callback) {
  if (callback) {
    resultPromise.then(result => {
      callback(result);
    }).catch((e) => {
      throw e;
    });
  } else {
    return resultPromise;
  }
}

// returns a promise for a connection to the database.
function connect() {
  return r.connect({ host: '192.168.90.176', port: 28015 });
}


function compareGraphs(graph1, graph2) { // hash should be saved in the graph object
  if (!graph1.hash) {
    graph1.hash = hash.digest(graph1.data);
  }

  if (!graph2.hash) {
    graph2.hash = hash.digest(graph2.data);
  }
  return graph1.hash === graph2.hash;
}


function isExistingGraph(newGraph, connection) {
  var graphListProm = r.db(dbName)
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
      return insert('version', { id: uuid(), pc_id: pcID, graph_id: existingGraphID, layout_ids: [] }, connection);
      // TODO: If the releaseid and pcid and graphid are already linked in version, don't create a new object?
      // this would allow an update script to run blindly
    } else {
      // create new graph

      return Promise.all([
        insert('graph', newGraph, connection),
        insert('version', { id: uuid(), pc_id: pcID, release_id: releaseID, graph_id: graphID, layout_ids: [] }, connection)
      ]);
    }
  }).catch((e) => {
    throw e;
  });


  return handleResult(result, callback);
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
  var queryRoot = getQueryRoot(pcID, releaseID);

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


  return handleResult(idPromise, callback);
}


// ----------- Submit a new layout -----------------------
/*
saveLayout(pcID, layout, releaseID, connection [,callback]) 
saves a new layout for the graph version specfied by the given pc id and release id.

Accepts 'latest' as a valid releaseID
*/
function saveLayout(pcID, layout, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = getQueryRoot(pcID, releaseID);

  // Create the new layout entry in the database
  var layoutID = uuid();
  var result = insert('layout', { id: layoutID, positions: layout, date_added: r.now() }, connection)
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

  return handleResult(result, callback);
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
  return handleResult(data, callback);
}

function getLayout(pcID, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = getQueryRoot(pcID, releaseID);


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
        .eqJoin((id) => { return id; }, r.db(dbName).table('layout'))
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
        console.log('This is happening');
        layout = null;
      } else {
        throw e;
      }
    });

  // handle callback/promise decision
  return handleResult(layout, callback);
}

function getGraph(pcID, releaseID, connection, callback) {
  // set the generic root for ease of use throughout the function.
  var queryRoot = getQueryRoot(pcID, releaseID);

  var graph = queryRoot
    .eqJoin('graph_id', r.db(dbName).table('graph'))
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

  return handleResult(graph, callback);
}

function setDatabase(name, connection, callback) {
  var prom = r.dbList()
    .run(connection)
    .then((dbList) => {
      if (dbList.indexOf(name) >= 0) {
        dbName = name;

      } else {
        throw Error('ERROR: Database ' + name + ' does not exist');
      }
    });

  return handleResult(prom, callback);
}

module.exports = {
  connect: connect,
  getLayout: getLayout,
  getGraph: getGraph,
  getGraphID: getGraphID,
  getGraphAndLayout: getGraphAndLayout,
  saveLayout: saveLayout,
  updateGraph: updateGraph,
  setDatabase: setDatabase
};
