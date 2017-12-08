const io = require('socket.io-client');
const qs = require('querystring');
const config = require('../../../config');
let socket = io.connect('/');


const fetchWrapper = function (url, options){
  return fetch(config.baseName + url, options);
};

const apiCaller = {
  getGraphAndLayout(uri, version) {
    return fetchWrapper(`/api/get-graph-and-layout?${qs.stringify({uri, version})}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res =>  res.json());
  },

  pcQuery(method, params){
    return fetchWrapper(`/pc2/${method}?${qs.stringify(params)}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    });
  },

  datasources(){
    return fetchWrapper('/pc2/datasources', {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res => res.json());
  },
  
  querySearch(query){
    return fetchWrapper(`/pc2/querySearch?${qs.stringify(query)}`,{
      'Content-type': 'application/json',
      'Accept': 'application/json'
    }).then(res => res.json());
  },

  getLatestLayouts(uri, version, numEntries) {
    return fetchWrapper(`/api/get-layout-history?${qs.stringify({uri, version, numEntries})}`, {
      method: 'GET', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(res =>  res.json());
  },
  
  renderImages(cyJson) {
    return fetchWrapper(`/api/render-png`, {
      method: 'POST', headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      },
      body : JSON.stringify({
        cyJson
      })
    }).then(res =>  res.json());
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