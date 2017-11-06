//Import Depedencies
const controller = require('./controller');
const express = require('express');
const btoa = require('btoa');
const router = express.Router();
const qs = require('querystring');


function getLayout(io, socket, ioPackage) {
  //console.log(Object.keys(socket));
  //console.log(Object.keys(socket.client));
  //console.log(socket.client);

  controller.getLayout(ioPackage.uri, ioPackage.version).then((package) => {
    socket.emit('layoutPackage', btoa(package));
  });
}

function submitLayout(io, socket, ioPackage) {
  controller.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout)
    .then((package) => {
      io.emit('updated', package);
    });
}

function submitDiff(io, socket, ioPackage) {
  controller.submitDiff(ioPackage.uri, ioPackage.version, ioPackage.layout, socket.id)
  .then((package)=>{
    io.emit('updated', package);
  });
}

let returnRouter = function (io) {
  io.on('connection', function (socket) {
    //Get Layout
    socket.on('getLayout', function (ioPackage) {
      console.log(socket.id);
      // Add socketID/userID to User table.
      // Store graphID 
      getLayout(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitLayout', function (ioPackage) {
      submitLayout(io, socket, ioPackage);
    });

    socket.on('submitDiff', function(ioPackage){
      submitDiff(io,socket,ioPackage);
    });

    socket.on('disconnect', function () {
      console.log(socket.id);
      let userURL = socket.handshake.headers.referer;

      let editParams = userURL.match(/edit\?(.*)/);

      if (editParams){

        let params = qs.parse(editParams[1]);
        let pcID = params.uri;
        let releaseID = params.releaseID || 'latest';

        controller.endSession(pcID, releaseID, socket.id);
      }
    });
  });

  return router;
};

module.exports = returnRouter;