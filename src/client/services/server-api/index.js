const io = require('socket.io-client');
const qs = require('querystring');
const _ = require('lodash');
const fetch = require('node-fetch');

const socket = io.connect('/');
const FETCH_TIMEOUT = 5000; //ms

let absoluteURL = (href) => {
  return ( location.origin + href) ;
};

const defaultFetchOpts = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const ServerAPI = {
  getPathway(uri, version) {
    return fetch(absoluteURL(`/api/get-graph-and-layout?${qs.stringify({uri, version})}`), defaultFetchOpts).then(res => res.json());
  },

  getPubmedPublications( pubmedIds ){
    return fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + pubmedIds.toString(), defaultFetchOpts).then(res => res.json());
  },

  getInteractionGraph(sources) {
    return fetch(absoluteURL(`/api/get-interaction-graph?${qs.stringify(sources)}`), defaultFetchOpts).then(res => res.json());
  },

  getGoInformation(goID) {
    return fetch(`https://www.ebi.ac.uk/QuickGO/services/ontology/go/search?query=GO%3A${goID.replace("GO:", "")}&limit=1&page=1`, {method: 'GET'})
    .then( res => res.json() )
    .then( res => { if(res.numberOfHits !== 0 ) return res; else return null; })
    .catch( () => { return null; });
  },

  getReactomeInformation(reactomeID) {
    return fetch(`https://reactome.org/ContentService/data/query/R-HSA-${reactomeID.replace("REAC:", "")}`, {method: 'GET'})
    .then( res => res.json() )
    .then( res => { if(res.summation) return res; else return null; })
    .catch( () => { return null; });
  },

  pcQuery(method, params){
    return fetch(absoluteURL(`/pc-client/${method}?${qs.stringify(params)}`), defaultFetchOpts);
  },

  datasources(){
    return fetch(absoluteURL('/pc-client/datasources'), defaultFetchOpts).then(res => res.json());
  },

  querySearch(query){
    const queryClone=_.assign({},query);
    if (/^((uniprot|hgnc):\w+|ncbi:[0-9]+)$/i.test(queryClone.q)) {
      queryClone.q=queryClone.q.replace(/^(uniprot|ncbi|hgnc):/i,"");
    }
    return fetch(absoluteURL(`/pc-client/querySearch?${qs.stringify(queryClone)}`), defaultFetchOpts).then(res => res.json());
  },

  enrichmentAPI(query, type){
    return fetch(absoluteURL(`/api/${type}`), {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query),
      timeout: FETCH_TIMEOUT
    })
    .then(res => res.json())
    .catch(err => {
      if (err.type == 'body-timeout') return undefined ;
      else err;
    });
  },

  geneQuery(query){
    return this.enrichmentAPI(query, "validation");
  },

  getGeneInformation(ids){
    return fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=gene&id=${ids.join(',')}`,{method: 'GET'})
    .then(res => res.json())
    .catch(() => undefined);
  },

  getUniprotInformation(ids){
    return fetch(`https://www.ebi.ac.uk/proteins/api/proteins?offset=0&accession=${ids.join(',')}`,defaultFetchOpts)
    .then(res => res.json())
    .catch(() => []);
  },

  getHgncInformation(id) {
    return fetch( `https://rest.genenames.org/fetch/symbol/${id}`, {headers: {'Accept': 'application/json'}} )
    .then(res => res.json())
    .catch(() => undefined);
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
  }
};

module.exports = ServerAPI;