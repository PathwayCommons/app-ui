//Import Depedencies
const auth = require('./../auth.js');
const query = require('./../../database/query');
const update = require('./../../database/update');
const lazyLoad = require('./../../lazyload');
const logger = require('./../../logger');

function getLayoutFallback(pcID, releaseID, connection) {
  return lazyLoad.queryMetadata(pcID)
    .catch(() => {
      return lazyLoad.queryPC(pcID);
    }).then(result => {
      let output = { graph: result, layout: null };

      if (connection && result.pathwayMetadata) {
        update.updateGraph(pcID, releaseID, result, connection);
      }

      return JSON.stringify(output);
    }).catch(() => {
      return `ERROR: Layout for ${pcID} could not be retrieved from database or PC2`;
    });
}

function getLayout(pcID, releaseID) {
  return query.connect().then((connection) => {
    return query.getGraphAndLayout(pcID, releaseID, connection)
      .then((layout) => {
        return JSON.stringify(layout);
      }).catch(() => {
        return getLayoutFallback(pcID, releaseID, connection);
      });
  }).catch((e) => {
    logger.error(e);
    // Error.
    return 'ERROR: Connection to database failed';
  });
}

function submitLayout(pcID, releaseID, layout) {
  //Get the requested layout
  return query.connect().then((connection) => {
    update.saveLayout(pcID, layout, releaseID, connection);
    return 'Layout was updated.';

  }).catch((e) => {
    logger.error(e);
    return 'ERROR: Something went wrong in submitting the layout';
  });
}

function submitGraph(pcID, releaseID, newGraph) {
  return query.connect().then((connection) => {
    return update.updateGraph(pcID, releaseID, newGraph, connection);
  }).catch((e) => {
    logger.error(e);
  });
}

module.exports = {
  submitLayout,
  submitGraph,
  getLayout
};