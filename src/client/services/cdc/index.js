const io = require('socket.io-client');
let socket = io.connect('/');

const CDC = {
  initGraphSocket(updateFunction) {
    socket.on('layoutPackage', (cyZip) => {
      let msg = atob(cyZip);
      try {
        let cyJSON = JSON.parse(msg);
        updateFunction(cyJSON);
      } catch(err) {
        if (msg.length > 0) {
          console.log(JSON.parse(msg));
          //console.log(msg);
        } else {
          throw err;
        }
      }
    });
  },

  // Request a graph from the server. Should send back a cyJSON graph
  requestGraph(uri, version) {
    socket.emit('getLayout', {uri: uri, version: version.toString()});
  },

  // Send a diff in a node to the backend. The backend will deal with merging these diffs into
  // a layout
  submitNodeChange(uri, version, nodeId, bbox) {
    socket.emit('submitDiff', {
      uri: uri,
      version: version.toString(),
      diff: {
        nodeID: nodeId,
        bbox: bbox
      }
    });
  },

  submitBaseLayoutChange(uri, version, layout) {
    socket.emit('submitLayout', {uri: uri, version: version, layout: layout});
  }
};

// All errors are currently sent through on this 'error' channel. We obviously will take out this
// console log in production but it's good to see where the errors are coming from
socket.on('error', (msg) => {
  console.log('##################\nCDC error\n'+msg+'\n##################');
});

module.exports = CDC;
