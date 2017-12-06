
const r = require('rethinkdb');
const heuristics = require('./heuristics');
const config = require('./config');
const db = require('./utilities');

// ------------------- Get a layout -----------------------
/*
getLayout(pcID, releaseID, connection [,callback]) 
Retrieves a layout the database for the 
Entry specficed by the tuple of pcID and releaseID.
 
Accepts 'latest' as a valid releaseID
*/
function getLayout(pcID, releaseID, connection, numEntries, callback) {
  // Extract a list of layouts associated with the version from the database
  let layout = db.queryRoot(pcID, releaseID)
    .run(connection)
    .then((cursor) => {
      return cursor.next(); // Convert list of valid versions (should be only 1)
    }).then((version) => {
      // join the layouts to their layout ids
      return r.expr(version.layout_ids) // create a rethink expression from list of ids
        .eqJoin((id) => { return id; }, r.db(config.databaseName).table('layout'))
        .zip()
        .orderBy(r.asc('date_added'))
        .run(connection);
    }).then((allSubmissions) => {
      // Run decision making process to amalgamate down to one layout to return
      // currently just returns the most recent submission
      return heuristics.run(allSubmissions, numEntries);
    }).then((result)=>{
      if(numEntries) {return result;}
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
function getGraph(pcID, releaseID, connection, callback) {
  let graph = db.queryRoot(pcID, releaseID)
    .eqJoin('graph_id', r.db(config.databaseName).table('graph'))
    .zip()
    .pluck('graph')
    .run(connection)
    .then((cursor) => {
      return cursor.next();
    }).then((result)=>{
      return result.graph;
    });

  return db.handleResult(graph, callback);
}


module.exports = {
  getLayout,
  getGraph
};
