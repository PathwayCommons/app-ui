const io = require('socket.io-client');
const qs = require('querystring');
const Qs = require('qs');
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
    return fetch(`/pc-client/${method}?${qs.stringify(params)}`, defaultFetchOpts);
  },

  datasources(){
    return fetch('/pc-client/datasources', defaultFetchOpts).then(res => res.json());
  },

  querySearch(query){
    return fetch(`/pc-client/querySearch?${qs.stringify(query)}`, defaultFetchOpts).then(res => res.json());
  },

  geneQuery(genes, target, organism) {
    return fetch(`/api/gene-query`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: Qs.stringify({
        genes: genes,
        target: target,
        organism: organism
      })
    }).then(res => res.json());
  },

  enrichment(genes, orderedQuery, userThr, minSetSize, maxSetSize, thresholdAlgo, custbg) {
    return fetch(`/api/enrichment`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: Qs.stringify({
        genes: genes,
        orderedQuery: orderedQuery,
        userThr: userThr,
        minSetSize: minSetSize,
        maxSetSize: maxSetSize,
        thresholdAlgo: thresholdAlgo,
        custbg: custbg
      })
    }).then(res => res.json());
  },

  emap(pathwayInfoList, JCWeight, OCWeight, cutoff) {
    return fetch(`/api/emap`, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: Qs.stringify({
        pathwayInfoList: pathwayInfoList,
        JCWeight: JCWeight,
        OCWeight: OCWeight,
        cutoff: cutoff
      })
    }).then(res => res.json())
  },

  getProteinInformation(uniprotId){
    return fetch(`https://www.ebi.ac.uk/proteins/api/proteins?offset=0&size=1&accession=${uniprotId}`,defaultFetchOpts).then(res => res.json());
  },

  getNeighborhood(uniprotId,format){
    return fetch(`http://www.pathwaycommons.org/pc2/graph?source=http://identifiers.org/uniprot/${uniprotId}&kind=neighborhood&format=${format}&pattern=controls-phosphorylation-of
  &pattern=in-complex-with&pattern=controls-expression-of&pattern=interacts-with`,defaultFetchOpts).then(res => res.text());
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