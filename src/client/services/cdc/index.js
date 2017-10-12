const io = require('socket.io-client');
var socket = io('192.168.90.176:3000');

const CDC = {
  initLayoutSocket(updateFunction) {
    socket.on('LayoutPackage', function(cyJSON) {
      updateFunction(cyJSON.graph);
    });
  },

  requestGraph(uri, version) {
    socket.emit('Layout/Get', {uri: uri, version: version.toString()});
  },

  requestKeyEval(key) {
    socket.emit('API CALL TO BE CHANGED', {key: key.toString()});
  }
};

module.exports = CDC;