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
    return fetch(`/pc-client/${method}?${qs.stringify(params)}`, defaultFetchOpts).then(res => res.json());
  },

  datasources(){
    return fetch('/pc-client/datasources', defaultFetchOpts).then(res => res.json());
  },

  querySearch(query){
    const queryClone=_.assign({},query);
    if(/(uniprot:\w+|ncbi:[0-9]+|hgnc:\w+)$/.test(queryClone.q)){queryClone.q=queryClone.q.split(':')[1];}
    return fetch(`/pc-client/querySearch?${qs.stringify(queryClone)}`, defaultFetchOpts).then(res => res.json());
  },

  geneQuery(query){
    if(query.genes.length>=1){
      const paddingAdded = _.max([2-query.genes.length,0]);
      const padding = _.times(paddingAdded,()=>'p');
      query.genes=_.concat(padding,query.genes);
      return fetch('/api/validation', {
        method:'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body:qs.stringify(query)
      }).then(res => res.json()).then(ids=> _.assign(ids,{unrecognized:_.drop(ids.unrecognized,paddingAdded)}));//remove padding
    }
    else{
      return Promise.resolve({geneInfo:[],unrecognized:[]});
    }
  },

  getGeneInformation(ids){
    return fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=gene&id=${ids.join(',')}`, {method: 'GET'}).then(res => res.json());
  },

  getUniprotnformation(ids){
    return fetch(`https://www.ebi.ac.uk/proteins/api/proteins?offset=0&accession=${ids.join(',')}`, defaultFetchOpts).then(res => res.json());
  },

  getNeighborhood(ids,kind){
   const source=ids.map(id=>`source=${id}`).join('&');
   const patterns = '&pattern=controls-phosphorylation-of&pattern=in-complex-with&pattern=controls-expression-of&pattern=interacts-with';
    return fetch(`http://www.pathwaycommons.org/pc2/graph?${source}&kind=${kind}&format=TXT${patterns}`,defaultFetchOpts).then(res => res.text());
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