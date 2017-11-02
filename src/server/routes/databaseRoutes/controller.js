//Import Depedencies
const auth = require('./../auth.js');
const query = require('./../../database/query');
const update = require('./../../database/update');
const lazyLoad = require('./../../lazyload');

function getLayoutFallback(pc_id, release_id, connection) {
  return lazyLoad.queryMetadata(pc_id)
    .catch(() => {
      return lazyLoad.queryPC(pc_id);
    }).then(result => {
      let output = { graph: result, layout: null };

      if (connection && result.pathwayMetadata) {
        update.updateGraph(pc_id, release_id, result, connection);
      }

      return JSON.stringify(output);
    }).catch(() => {
      return `ERROR: Layout for ${pc_id} could not be retrieved from database or PC2`;
    });
}

function getLayout(pc_id, release_id) {
  return query.connect().then((connection) => {
    return query.getGraphAndLayout(pc_id, release_id, connection)
      .then((layout) => {
        return JSON.stringify(layout);
      }).catch(() => {
        return getLayoutFallback(pc_id, release_id, connection);
      });
  }).catch(() => {
    // Error.
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