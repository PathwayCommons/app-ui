const r = require('rethinkdb');
const db = require('./../database/accessDB.js');
const uuid = require('uuid/v4');
const dbName = 'layouts';

var handleResult = db.handleResult;

function extractLayoutFromGraph(graph) {
  var layout = {};
  var nodes = graph.nodes;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    layout.node.data.id = node.data.bbox;
  }

  return layout;
}

function updateLayoutFromGraphID(graph_id, diff, connection, callback) {
  var result = r.db(dbName).table('graph').get(graph_id).run(connection)
    .then((graphRow) => {
      var newLayout = extractLayoutFromGraph(graphRow.graph);
      newLayout[diff.node_id] = diff.bbox;

      return newLayout;
    });

  return handleResult(result, callback);
}

function updateLayoutFromExisting(layoutID, diff, connection, callback) {
  var result = r.db(dbName).table('layout').get(layoutID).run(connection)
    .then((layout) => {
      var positions = layout.positions;
      positions[diff.node_id] = diff.bbox;

      return positions;
    });

  return handleResult(result, callback);
}

function saveDiff(pcID, releaseID, diff, connection, callback) {
  var queryRoot = db.queryRoot(pcID, releaseID);

  var result = queryRoot
    .run(connection)
    .then((cursor) => {
      return cursor.toArray();
    }).then((result) => {
      var version = result[0];
      var layoutID = uuid();
      var existingLayout = version.layout_ids.length > 0;
      var latest = existingLayout ? existingLayout[-1] : null;

      if (version.activeEdit) {
        return r.db(dbName).table('layout')
          .get(version.layout_ids[-1])
          .update({ positions: { [diff.node_id]: diff.bbox } })
          .run(connection);

      } else {
        // Set version.activeEdit to be true in the database
        var versionUpdate = r.db(dbName).table('version').get(version.id).update(
          { layout_ids: version['layout_ids'].append(layoutID), activeEdit: true })
          .run(connection);

        // Add diff to the most recent layout, whether that be a previous submission
        // or the one stored in the graph object. (Either way that what the user was fed 
        // at the beginning of the edit session)
        var createLayout = existingLayout ?
          updateLayoutFromExisting(latest, diff, connection) :
          updateLayoutFromGraphID(version.graph_id, diff, connection);

        // Save this updated layout to the database.
        var writeLayout = createLayout.then((positions) => {
          return r.db(dbName)
            .table('layout')
            .insert({ id: layoutID, positions: positions })
            .run(connection);
        });

        return Promise.all([versionUpdate, writeLayout]);
      }
    });

  return db.handleResult(result, callback);
}

function endSession (pcID, versionID, connection, callback){
  return db.queryRoot(pcID,versionID).update({activeEdit: false}).run(connection,callback);
}

function getLayout(){

}

module.exports = {
  saveDiff: saveDiff
};