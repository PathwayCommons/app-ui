//Import Depedencies
const controller = require('./controller');
const express = require('express');
const btoa = require('btoa');
const router = express.Router();


function getLayout(io, socket, ioPackage) {
  controller.getLayout(ioPackage.uri, ioPackage.version).then((package) => {
    socket.emit('layoutPackage', btoa(package));
  });
}

function submitLayout(io, socket, ioPackage) {
  controller.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout, ioPackage.key)
    .then((package) => {
      io.emit('updated', package);
    });
}

var returnRouter = function (io) {
  io.on('connection', function (socket) {
    //Get Layout
    socket.on('getLayout', function (ioPackage) {
      getLayout(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitLayout', function (ioPackage) {
      submitLayout(io, socket, ioPackage);
    });
  });

  return router;
};

module.exports = returnRouter;