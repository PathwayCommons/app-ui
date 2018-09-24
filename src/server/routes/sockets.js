//Import Depedencies
const controller = require('./controller');
const btoa = require('btoa');
const qs = require('querystring');
const io = require('./../io').get();

io.on('connection', function (socket) {

  // hack to see which uri (pathway) is being edited
  // todo find a better way.  best would be to send uri as a param
  let referer = socket.handshake.headers.referer;
  let params = referer.match(/(edit|view)\?(.*)/);
  if (params){
    let uri = qs.parse(params[2]).uri;
    socket.join(uri);
  }
  // create socket.io endpoint for controller.getGraphAndLayout
  socket.on('getGraphAndLayout', function (ioPackage) {
    // Add socketID/userID to User table.
    // Store graphID
    controller.getGraphAndLayout(ioPackage.uri, ioPackage.version).then((package) => {
      socket.emit('layoutPackage', btoa(JSON.stringify(package)));
    });
  });

  // create socket.io endpoint for controller.submitLayout
  socket.on('submitLayout', function (ioPackage) {
    controller.submitLayout(ioPackage.uri, ioPackage.version, ioPackage.layout, socket.id)
    .then((package) => {
      io.emit('updated', package);
    });

    io.to(ioPackage.uri).emit('layoutChange', ioPackage.layout);
  });

  // create socket.io endpoint for controller.submitDiff
  socket.on('submitDiff', function (ioPackage) {
    controller.submitDiff(ioPackage.uri, ioPackage.version, ioPackage.diff, socket.id)
    .then((package) => {
      io.emit('updated', package);
    });

    io.to(ioPackage.uri).emit('nodeChange', ioPackage.diff);
  });

  // On disconnect, determine which pathway the user was viewing
  // and end their edit session
  socket.on('disconnect', function () {
    let userURL = socket.handshake.headers.referer;

    let editParams = userURL.match(/edit\?(.*)/);

    if (editParams) {

      let params = qs.parse(editParams[1]);
      let pcID = params.uri;
      let releaseID = params.releaseID || 'latest';

      controller.endSession(pcID, releaseID, socket.id);
    }
  });
});
