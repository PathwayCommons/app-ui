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
    // Error.
    logger.error(e);
    return 'ERROR: Connection to database failed';
  });
}

function submitLayout(pcID, releaseID, layout, key) {
  //Get the requested layout
  return query.connect().then((connection) => {
    if (hasRightKey(pcID, releaseID, key)) {
      update.saveLayout(pcID, layout, releaseID, connection);
      return 'Layout was updated.';
    }
    else {
      return 'ERROR: Incorrect Edit key';
    }
  }).catch(() => {
    return 'ERROR: Something went wrong in submitting the layout';
  });
}

function getEditKey(pcID, releaseID, remoteAddress, socketIO = false) {
  return query.connect().then((connection) => {
    if (auth.checkUser(remoteAddress, socketIO)) {
      return query.getGraphID(pcID, releaseID, connection).then((result) => {
        if (result) {
          return result;
        } else {
          return 'ERROR: No edit key could be found';
        }

      });
    } else {
      return 'ERROR: Non-authenticated user';
    }
  }).catch(() => {
    return 'ERROR: Edit Key Request Failed';
  });
}

function hasRightKey(pcID, releaseID, key) {
  return query.connect().then((connection) => {
    return query.getGraphID(
      pcID,
      releaseID,
      connection
    );
  }).then((result) => {
    return result === key;
  });
}

function checkEditKey(pcID, releaseID, key) {
  return hasRightKey(pcID, releaseID, key)
    .catch(() => {
      return 'ERROR : Edit Priviliges Check Failed';
    });
}

module.exports = {
  checkEditKey,
  getEditKey,
  submitLayout,
  getLayout
};