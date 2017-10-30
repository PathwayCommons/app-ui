//Import Depedencies
const routes = require('./databaseRoutes');
const express = require('express');
const router = express.Router();


function getLayoutSocket(io, socket, ioPackage) {
  routes.getLayout(ioPackage.uri, ioPackage.version).then((package) => {
    io.emit(package.socket, package.result);
  });
}

function submitLayoutSocket(io, socket, ioPackage) {
  routes.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout, ioPackage.key)
    .then((package) => {
      io.emit(package.socket, package.result);
    });
}

function getEditKeySocket(io, socket, ioPackage) {
  routes.getEditKey(ioPackage.uri, ioPackage.version, socket.request.connection.remoteAddress, true)
    .then((package) => {
      io.emit(package.socket, package.result);
    });
}

function checkEditKeySocket(io, socket, ioPackage) {
  routes.checkEditKey(ioPackage.uri, ioPackage.version, ioPackage.key)
    .then((package) => {
      io.emit(package.socket, package.result);
    });
}

var returnRouter = function (io) {
  io.on('connection', function (socket) {
    //Get Layout
    socket.on('getLayout', function (ioPackage) {
      getLayoutSocket(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitLayout', function (ioPackage) {
      submitLayoutSocket(io, socket, ioPackage);
    });

    socket.on('getEditKey', function (ioPackage) {
      getEditKeySocket(io, socket, ioPackage);
    });

    socket.on('checkEditKey', function (ioPackage) {
      checkEditKeySocket(io, socket, ioPackage);
    });

  });

  return router;
};

module.exports = returnRouter;