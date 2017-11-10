//Import Depedencies
const controller = require('./controller');
const btoa = require('btoa');
const qs = require('querystring');


function getGraphAndLayout(io, socket, ioPackage) {
  controller.getGraphAndLayout(ioPackage.uri, ioPackage.version).then((package) => {
    socket.emit('layoutPackage', btoa(JSON.stringify(package)));
  });
}

function submitLayout(io, socket, ioPackage) {
  controller.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout, socket.id)
    .then((package) => {
      io.emit('updated', package);
    });
}

function submitDiff(io, socket, ioPackage) {
  controller.submitDiff(ioPackage.uri, ioPackage.version, ioPackage.diff, socket.id)
  .then((package)=>{
    io.emit('updated', package);
  });
}

function disconnect(socket) {
  let userURL = socket.handshake.headers.referer;

  let editParams = userURL.match(/edit\?(.*)/);

  if (editParams){

    let params = qs.parse(editParams[1]);
    let pcID = params.uri;
    let releaseID = params.releaseID || 'latest';

    controller.endSession(pcID, releaseID, socket.id);
  }
}

let socketInit = function (io) {
  io.on('connection', function (socket) {
    //Get Layout
    socket.on('getGraphAndLayout', function (ioPackage) {
      // Add socketID/userID to User table.
      // Store graphID 
      getGraphAndLayout(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitLayout', function (ioPackage) {
      submitLayout(io, socket, ioPackage);
    });

    socket.on('submitDiff', function(ioPackage){
      submitDiff(io,socket,ioPackage);
    });

    socket.on('disconnect', function () {
      disconnect(socket);
    });
  });
};

module.exports = socketInit;