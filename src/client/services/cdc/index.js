const io = require('socket.io-client');
var socket = io('192.168.90.176:3000');

const CDC = {
  initLayoutSocket(updateFunction) {
    socket.on('LayoutPackage', (cyJSON) => {
      updateFunction(cyJSON.graph);
    });
  },

  initEditLinkSocket(updateFunction) {
    socket.on('EditKey', (editURI) => {
      updateFunction(editURI);
    });
  },

  requestGraph(uri, version) {
    socket.emit('Layout/Get', {uri: uri, version: version.toString()});
  },

  requestEditLink(uri, version) {
    // console.log('--------------------------------\nREQUESTING EDIT LINK FOR '+uri);
    socket.emit('getEditKey', {uri: uri, version: version.toString()});
  }

};

socket.on('error', (msg) => {
  console.log('##################\nCDC error\n'+msg+'\n##################');
});

module.exports = CDC;