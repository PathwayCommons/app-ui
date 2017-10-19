//


//Import Depedencies
const auth = require('./auth.js');
const accessDB = require('./../database/accessDB.js');
const lazyLoad = require('./../lazyload');
const btoa = require('btoa');

const express = require('express');
const router = express.Router();

var connPromise = accessDB.connect(); // returns a promise.



// Get a layout and respond using socket.io
function getLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      accessDB.getGraphAndLayout(
        ioPackage.uri,
        ioPackage.version,
        connection,
        function (layout, err) {
          if (!err){
            io.emit('layoutPackage', btoa(JSON.stringify(layout)));
          } else {
            lazyLoad.queryPC();
          }
        });
    });
  }
  catch (e) {
    console.log(e);
    io.emit('error', 'error');
  }
}

// Submit a layout and respond using socket.io
function submitLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      if (hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key)) {
        accessDB.saveLayout(ioPackage.uri,
          ioPackage.layout,
          ioPackage.version,
          connection,
          function () { io.emit('updated', 'Layout was updated.'); });
      }
      else {
        io.emit('error', 'ERROR');
      }
    }).catch((e) => {
      throw e;
    });
  }
  catch (e) {
    io.emit('error', 'ERROR');
  }
}

function getEditKey(io, socket, ioPackage) {

  try {
    connPromise.then((connection) => {
      if (auth.checkUser(socket.request.connection.remoteAddress, true)) {
        accessDB.getGraphID(
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
    });
  }
  catch (e) {
    io.emit('error', 'ERROR: Edit Key Request Failed');
    throw e;
  }
}

function hasRightKey(pc_id, release_id, key) {
  return connPromise.then((connection) => {
    return accessDB.getGraphID(
      pc_id,
      release_id,
      connection
    );
  }).then((result) => {
    return result === key;
  });
}

function checkEditKey(io, socket, ioPackage) {
  try {
    hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key).then((result) => {
      io.emit('editPermissions', result);
    }).catch(() => {
      io.emit('error', 'ERROR : Edit Priviliges Check Failed');
    });
  } catch (e) {
    io.emit('error', 'ERROR : Edit Priviliges Check Failed');
    throw e;
  }
}

var returnRouter = function (io) {
  io.on('connection', function (socket) {
    console.log('I hear voices');
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