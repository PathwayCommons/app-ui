const io = require('socket.io-client');
const qs = require('querystring');
const _ = require('lodash');

const socket = io.connect('/');

const defaultFetchOpts = {
  method: 'GET', headers: {
    'Content-type': 'application/json',
    'Accept': 'application/json'
  }
};

const ServerAPI = {
  getGraphAndLayout(uri, version) {
    return fetch(`/api/get-graph-and-layout?${qs.stringify({uri, version})}`, defaultFetchOpts).then(res =>  res.json());
  },

  pcQuery(method, params){
    return fetch(`/pc2/${method}?${qs.stringify(params)}`, defaultFetchOpts);
  },

  datasources(){
    return fetch('/pc2/datasources', defaultFetchOpts).then(res => res.json());
  },
  
  querySearch(query){
    return fetch(`/pc2/querySearch?${qs.stringify(query)}`, defaultFetchOpts).then(res => res.json());
  },

  getLatestLayouts(uri, version, numEntries) {
    return fetch(`/api/get-layout-history?${qs.stringify({uri, version, numEntries})}`, defaultFetchOpts).then(res =>  res.json());
  },
  
  renderImages(cyJson) {
    return fetch(`/api/render-png`, _.assign({}, defaultFetchOpts, { method: 'POST', body: JSON.stringify({cyJson}) })).then(res =>  res.json());
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

module.exports = ServerAPI;