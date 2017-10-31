//Import Depedencies
const routes = require('./databaseRoutes');
const express = require('express');
const router = express.Router();


function getLayout(io, socket, ioPackage) {
  routes.getLayout(ioPackage.uri, ioPackage.version).then((package) => {
    io.emit(package.socket, package.result);
  });
}

function submitLayout(io, socket, ioPackage) {
  routes.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout, ioPackage.key)
    .then((package) => {
      io.emit(package.socket, package.result);
    });
}

function getEditKey(io, socket, ioPackage) {
  routes.getEditKey(ioPackage.uri, ioPackage.version, socket.request.connection.remoteAddress, true)
    .then((package) => {
      io.emit(package.socket, package.result);
    });
}

function checkEditKey(io, socket, ioPackage) {
  routes.checkEditKey(ioPackage.uri, ioPackage.version, ioPackage.key)
    .then((package) => {
      io.emit(package.socket, package.result);
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