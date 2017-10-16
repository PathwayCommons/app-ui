const io = require('socket.io-client');
var socket = io('192.168.90.176:3000');
var gzip = require('gzip-js');

const CDC = {
  initLayoutSocket(updateFunction) {
    socket.on('LayoutPackage', (cyZip) => {
      var cyString = "";
      gzip.unzip(cyZip).forEach(ch => cyString+=(String.fromCharCode(ch)));
      var cyJSON = JSON.parse(cyString);
      updateFunction(cyJSON.graph);
    });
  },

  initEditLinkSocket(updateFunction) {
    socket.on('EditKey', (editURI) => {
      updateFunction(editURI);
    });
  },

  initEditKeyValidation(updateFunction) {
    socket.on('EditPermissions', (valid) => {
      updateFunction(valid);
    });
  },

  requestGraph(uri, version) {
    socket.emit('getlayout', {uri: uri, version: version.toString()});
  },

  requestEditLink(uri, version) {
    // console.log('--------------------------------\nREQUESTING EDIT LINK FOR '+uri);
    socket.emit('getEditKey', {uri: uri, version: version.toString()});
  },

  requestEditKeyValidation(uri, version, key) {
    socket.emit('checkEditKey', {uri: uri, version: version.toString(), key: key});
  }

};

socket.on('error', (msg) => {
  console.log('##################\nCDC error\n'+msg+'\n##################');
});

module.exports = CDC;