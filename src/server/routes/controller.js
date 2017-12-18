//Import Depedencies
const query = require('./../database/query');
const db = require('./../database/utilities');
const update = require('./../database/update');
const logger = require('./../logger');
const diffSaver = require('./../database/saveDiffs');
const renderImage= require('../graph-renderer/renderImage');

// getGraphFallback(pcID, releaseID, connection)
// Retrieves the graph specified by (pcID, releaseID) if something
// goes wrong with the request for a graph. It executes a lazyload
// and tries to save this new information to the database to avoid the
// issue in the future.
function getGraphFallback(pcID, releaseID, connection) {
  return query.getGraphFromPC(pcID, releaseID, connection);
}

// getGraphAndLayout(pcID, releaseID)
// return both the graph and the most recent layout
// specified by (pcID, releaseID). It wll execute a
// series of fallbacks if something goes wrong.
function getGraphAndLayout(pcID, releaseID) {
  return db.connect().then((connection) => {
    return Promise.all([
      query.getGraph(pcID, releaseID, connection).catch(() => getGraphFallback(pcID, releaseID, connection)),
      query.getLayout(pcID, releaseID, connection).catch(() => Promise.resolve(null))
    ]).then(([graph, layout]) => {
      return { graph, layout };
    }).catch((e)=>{
      logger.error(e);
      return `ERROR : could not retrieve graph for ${pcID}`;
    });
  });
}

// submitLayout(pcID, releaseID, layout, userID)
// saves the given layout and the id of the user to the version specified by
// (pcID, releaseID)
function submitLayout(pcID, releaseID, layout, userID) {
  //Get the requested layout
  return db.connect().then((connection) => {
    update.saveLayout(pcID, releaseID, layout, userID, connection);
    return 'Layout was updated.';

  }).catch((e) => {
    logger.error(e);
    return 'ERROR: Something went wrong in submitting the layout';
  });
}

// submitGraph(pcID, releaseID, newGraph) saves the given graph
// to the version specified by (pcID, releaseID)
function submitGraph(pcID, releaseID, newGraph) {
  return db.connect().then((connection) => {
    return update.updateGraph(pcID, releaseID, newGraph, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// submitDiff(pcID, releaseID, diff, userID) updates the saved
// layout with the given diff for the version specified by (pcID, releaseID)
function submitDiff(pcID, releaseID, diff, userID) {
  return db.connect().then((connection) => {
    return diffSaver.saveDiff(pcID, releaseID, diff, userID, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

// endSession(pcID, releaseID, userID) removes the userID from the list
// of users editing the pathway specified by  (pcID, releaseID)
function endSession(pcID, releaseID, userID) {
  return db.connect().then((connection) => {
    return diffSaver.popUser(pcID, releaseID, userID, connection);
  });
}

//getHistory(pcId, releaseID) 
//Returns the last 10 layouts submitted 
//Requires a valid pcID and releaseId
function getHistory(pcID, releaseID, numEntries) {
  return db.connect().then((connection) => {
    return Promise.all([
      query.getGraph(pcID, releaseID, connection).catch(() => getGraphFallback(pcID, releaseID, connection)),
      query.getLayout(pcID, releaseID, connection, numEntries).catch(() => Promise.resolve(null))
    ]).then(([graph, layout]) => {
      return { graph, layout };
    }).catch((e)=>{
      logger.error(e);
      return `ERROR : could not retrieve layouts  for ${pcID}`;
    });
  });
}

//renderPNG(pcId, releaseID) 
//Renders a cytoscape object to PNG
//Requires a valid cytoscape json
function renderPNG(cyJson) {
  return renderImage(cyJson);
}

module.exports = {
  submitLayout,
  submitGraph,
  submitDiff,
  endSession,
  getGraphAndLayout,
  getHistory,
  renderPNG
};