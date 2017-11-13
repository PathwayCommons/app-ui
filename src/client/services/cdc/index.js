const io = require('socket.io-client');
let socket = io.connect('/');

const CDC = {
  getGraphAndLayout(uri, version) {
    return fetch(`http://192.168.90.176:3000/get-graph-and-layout?uri=${encodeURIComponent(uri)}&version=${version}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res => res.json())
    .then(data => JSON.parse(data));
  },

  // Send a diff in a node to the backend. The backend will deal with merging these diffs into
  // a layout
  submitNodeChange(uri, version, nodeId, bbox) {
    console.log('SENT A NODE CHANGE');
    socket.emit('submitDiff', {
      uri: uri,
      version: version.toString(),
      diff: {
        nodeID: nodeId,
        bbox: bbox
      }
    });
  },

  submitLayoutChange(uri, version, layout) {
    console.log('SENT A LAYOUT CHANGE');
    socket.emit('submitLayout', {
      uri: uri,
      version: version,
      layout: layout
    });
  },

  initReceiveLayoutChange(callback) {
    console.log('LAYOUT GOT INITIATED');
    socket.on('layoutChange', layoutJSON => {
      console.log('RECEIVED A LAYOUT CHANGE');
      console.log(layoutJSON);
      callback(layoutJSON);
    });
  },

  initReceiveNodeChange(callback) {
    console.log('NODE GOT INITIATED');
    socket.on('nodeChange', nodeDiff => {
      console.log('RECEIVED A NODE CHANGE');
      //console.log(nodeDiff);
      callback(nodeDiff);
    });
  },
};

module.exports = CDC;