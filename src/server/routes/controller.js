//Import Depedencies
const query = require('./../database/query');
const db = require('./../database/utilities');
const update = require('./../database/update');
const lazyLoad = require('./../lazyload');
const logger = require('./../logger');
const diffSaver = require('./../database/saveDiffs');

function getGraphFallback(pcID, releaseID, connection) {
  return lazyLoad.queryMetadata(pcID)
    .catch(() => {
      return lazyLoad.queryPC(pcID);
    }).then(result => {
      if (connection && result.pathwayMetadata) {
        update.updateGraph(pcID, releaseID, result, connection);
      }
      return result;
    });
}



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

function submitGraph(pcID, releaseID, newGraph) {
  return db.connect().then((connection) => {
    return update.updateGraph(pcID, releaseID, newGraph, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

function submitDiff(pcID, releaseID, diff, userID) {
  return db.connect().then((connection) => {
    return diffSaver.saveDiff(pcID, releaseID, diff, userID, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

function endSession(pcID, releaseID, userID) {
  return db.connect().then((connection) => {
    return diffSaver.popUser(pcID, releaseID, userID, connection);
  });
}

module.exports = {
  submitLayout,
  submitGraph,
  submitDiff,
  endSession,
  getGraphAndLayout
};