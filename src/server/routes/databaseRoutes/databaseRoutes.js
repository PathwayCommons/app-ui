//Import Depedencies
const auth = require('./../auth.js');
const query = require('./../../database/query');
const update = require('./../../database/update');
const lazyLoad = require('./../../lazyload');
const btoa = require('btoa');

function getLayoutFallback(pc_id, release_id, connection) {
  return lazyLoad.queryMetadata(pc_id)
    .catch(() => {
      return lazyLoad.queryPC(pc_id);
    }).then(result => {
      let output = { graph: result, layout: null };

      if (connection && result.pathwayMetadata) {
        update.updateGraph(pc_id, release_id, result, connection);
      }

      return { result: btoa(JSON.stringify(output)), socket: 'layoutPackage' };
    }).catch(() => {
      let result = `ERROR: Layout for ${pc_id} could not be retrieved from database or PC2`;
      return { result, socket: 'error' };
    });
}

function getLayout(pc_id, release_id) {
  return query.connect().then((connection) => {
    return query.getGraphAndLayout(pc_id, release_id, connection)
      .then((layout) => {
        return { result: btoa(JSON.stringify(layout)), socket: 'layoutPackage' };
      }).catch(() => {
        return getLayoutFallback(pc_id, release_id, connection);
      });
  }).catch(() => {
    return getLayoutFallback(pc_id, release_id);
  });
}

function submitLayout(pcID, releaseID, layout, key) {
  //Get the requested layout
  return query.connect().then((connection) => {
    if (hasRightKey(pcID, releaseID, key)) {
      update.saveLayout(pcID, layout, releaseID, connection);
      return { socket: 'updated', result: 'Layout was updated.' };
    }
    else {
      return { socket: 'error', result: 'ERROR: Incorrect Edit key' };
    }
  }).catch(() => {
    return { socket: 'error', result: 'ERROR: Something went wrong in submitting the layout' };
  });
}

function getEditKey(pcID, releaseID, remoteAddress, socketIO = false) {
  return query.connect().then((connection) => {
    if (auth.checkUser(remoteAddress, socketIO)) {
      return query.getGraphID(pcID, releaseID, connection).then((result) => {
        if (result) {
          return { socket: 'editKey', result: pcID + '&editkey=' + result };
        } else {
          return { socket: 'error', result: 'ERROR: No edit key could be found' };
        }

      });
    } else {
      return { socket: 'error', result: 'ERROR: Non-authenticated user' };
    }
  }).catch(() => {
    return { socket: 'error', result: 'ERROR: Edit Key Request Failed' };
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
    .then((result) => {
      return { socket: 'editPermssions', result };
    }).catch(() => {
      return { socket: 'error', result: 'ERROR : Edit Priviliges Check Failed' };
    });
}

module.exports = {
  checkEditKey,
  getEditKey,
  submitLayout,
  getLayout
};