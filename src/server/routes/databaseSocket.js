//Import Depedencies
const auth = require('./auth.js');
const query = require('./../database/query');
const update = require('./../database/update');
//const saveDiffs = require('./../database/saveDiffs.js')(database);
const lazyLoad = require('./../lazyload');
const btoa = require('btoa');

const express = require('express');
const router = express.Router();

let connPromise = query.connect(); // returns a promise.

function getLayoutFallback(io, socket, ioPackage, connection) {
  lazyLoad.queryMetadata(ioPackage.uri)
  .catch((e) => {
    return lazyLoad.queryPC(ioPackage.uri);
  }).then(result => {
    let output = { graph: result, layout: null };
    io.emit('layoutPackage', btoa(JSON.stringify(output)));

    if (connection && result.pathwayMetadata) {
      console.log('I am writing this new stufff');
      update.updateGraph(ioPackage.uri, ioPackage.version, result, connection);
    }
  }).catch((e) => {
    console.log(e);
    io.emit('error', `ERROR: Layout for ${ioPackage.uri} could not be retrieved from database or PC2`);
  });
}

// Get a layout and respond using socket.io
function getLayout(io, socket, ioPackage) {
  //Get the requested layout

  connPromise.then((connection) => {
    query.getGraphAndLayout(
      ioPackage.uri,
      ioPackage.version,
      connection)
      .then((layout) => {
        io.emit('layoutPackage', btoa(JSON.stringify(layout)));
      }).catch(() => {
        return getLayoutFallback(io, socket, ioPackage, connection);
      });
  }).catch(() => {
    getLayoutFallback(io, socket, ioPackage);
  });
}

// Submit a layout and respond using socket.io
function submitLayout(io, socket, ioPackage) {
  //Get the requested layout

  connPromise.then((connection) => {
    if (hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key)) {
      update.saveLayout(ioPackage.uri,
        ioPackage.layout,
        ioPackage.version,
        connection,
        function () { io.emit('updated', 'Layout was updated.'); });
    }
    else {
      io.emit('error', 'ERROR: Incorrect Edit key');
    }
  }).catch((e) => {
    io.emit('error', 'ERROR: Something went wrong in submitting the layout');

  });

}

function getEditKey(io, socket, ioPackage) {
  connPromise.then((connection) => {
    if (auth.checkUser(socket.request.connection.remoteAddress, true)) {
      query.getGraphID(
        ioPackage.uri,
        ioPackage.version,
        connection,
        function (result) {
          if (result) {
            io.emit('editKey', ioPackage.uri + '&editkey=' + result);
          } else {
            io.emit('error', 'ERROR: No edit key could be found');
          }
        });
    } else {
      io.emit('error', 'ERROR: Non-authenticated user');
    }
  }).catch(() => {
    io.emit('error', 'ERROR: Edit Key Request Failed');
  });

}

function hasRightKey(pc_id, release_id, key) {
  return connPromise.then((connection) => {
    return query.getGraphID(
      pc_id,
      release_id,
      connection
    );
  }).then((result) => {
    return result === key;
  });
}

function checkEditKey(io, socket, ioPackage) {
  hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key).then((result) => {
    io.emit('editPermissions', result);
  }).catch(() => {
    io.emit('error', 'ERROR : Edit Priviliges Check Failed');
  });
}

let returnRouter = function (io) {
  io.on('connection', function (socket) {
    //Get Layout
    socket.on('getLayout', function (ioPackage) {
      getLayout(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitLayout', function (ioPackage) {
      submitLayout(io, socket, ioPackage);
    });

    socket.on('getEditKey', function (ioPackage) {
      getEditKey(io, socket, ioPackage);
    });

    socket.on('checkEditKey', function (ioPackage) {
      checkEditKey(io, socket, ioPackage);
    });

  });

  return router;
};

module.exports = returnRouter;