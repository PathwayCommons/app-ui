const io = require('socket.io-client');
const qs = require('querystring');
let socket = io.connect('/');

const apiCaller = {
  getGraphAndLayout(uri, version) {
    return fetch(`/api/get-graph-and-layout?${qs.stringify({uri, version})}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res =>  res.json());
  },

  pcQuery(method, params){
    return fetch(`/pc2/${method}?${qs.stringify(params)}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    });
  },

  datasources(){
    return fetch('/pc2/datasources', {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res => res.json());
  },
  
  querySearch(query){
    return fetch(`/pc2/querySearch?${qs.stringify(query)}`,{
      'Content-type': 'application/json',
      'Accept': 'application/json'
    }).then(res => res.json());
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

  submitLayoutChange(uri, version, layout) {
    socket.emit('submitLayout', {
      uri: uri,
      version: version,
      layout: layout
    });
  },

  initReceiveLayoutChange(callback) {
    socket.on('layoutChange', layoutJSON => {
      callback(layoutJSON);
    });
  },

  initReceiveNodeChange(callback) {
    socket.on('nodeChange', nodeDiff => {
      callback(nodeDiff);
    });
  },

};

module.exports = apiCaller;