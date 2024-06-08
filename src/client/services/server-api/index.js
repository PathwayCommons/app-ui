const qs = require('query-string');
const _ = require('lodash');

let PC_URL;
const { fetch } = require('../../../util');

const defaultFetchOpts = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const ServerAPI = {
  getPCURL(){
    if( PC_URL ){
      return Promise.resolve(PC_URL);
    } else {
      return fetch('/api/pc/baseURL')
        .then( res => res.text() )
        .then( baseUrl => {
          PC_URL = baseUrl;
          return PC_URL;
        });
    }
  },

  // a generic method that gets pathway sbgn json from various sources
  // e.g. pathwaycommons, factoid, or human created layouts
  getAPIResource(opts){
    let { type, uri, id } = opts;
    if( type === 'pathways' ){
      if( uri !== null ){
        return this.getPathway( uri );
      } else {
        throw new Error('Invalid parameter.  Pathways api calls require a uri parameter');
      }
    }
    if( type === 'biofactoid' ){
      if( id !== null ){
        return this.getDocById(opts.id);
      } else {
        throw new Error('Invalid paramter. Factoids api calls require a id parameter');
      }
    }
  },

  getPathway(uri) {
    let url = `/api/pathways?${ qs.stringify({ uri }) }`;
    const fetchOpts = _.assign( {}, defaultFetchOpts );
    return (
      fetch(url, fetchOpts)
        .then(res =>  res.json())
        .then( pathwayJson => {
          return {
            graph: pathwayJson
          };
        })
    );
  },

  getAllDocs() {
    return (
      fetch('/api/biofactoid', defaultFetchOpts)
        .then( res => res.json() )
    );
  },

  getDocById(id) {
    let url = `/api/biofactoid/${ id }`;
    return (
      fetch(url, defaultFetchOpts)
        .then(res =>  res.json())
        .then( pathwayJson => {
          return {
            graph: pathwayJson
          };
        })
    );
  },

  getInteractionGraph(sources) {
    return (
      fetch(`/api/interactions?${qs.stringify(sources)}`, defaultFetchOpts)
       .then( res => res.json())
    );
  },

  getPubmedPublications( pubmedIds ){
    return (
      fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + pubmedIds.toString())
        .then(res => res.json())
        .then(res => {
          let { result } = res;
          if( result == null ){ return []; }
          let { uids } = result;

          return uids.map( uid => {
            let { title, authors, sortfirstauthor, sortpubdate, source } = result[uid];

            return {
              id: uid,
              title,
              authors,
              firstAuthor: sortfirstauthor,
              date: sortpubdate,
              source
            };
          } );
        })
    );
  },

  getGoInformation(goID) {
    return fetch(`https://www.ebi.ac.uk/QuickGO/services/ontology/go/search?query=GO%3A${goID}&limit=1&page=1`)
    .then( res => res.json() );
  },

  getReactomeInformation(reactomeID) {
    return fetch(`https://reactome.org/ContentService/data/query/${reactomeID}`)
    .then( res => res.json() );
  },

  downloadFileFromPathwayCommons( uri, format ){
    return this.getPCURL()
      .then( url => {
        return fetch(url + 'pc2/get?' + qs.stringify({ uri, format}), defaultFetchOpts);
      });
  },

  search(query){
    const queryClone=_.assign({},query);
    if (/^((uniprot|hgnc|hgnc.symbol):\w+|ncbi:[0-9]+)$/i.test(queryClone.q)) {
      queryClone.q=queryClone.q.replace(/^(uniprot|ncbi|hgnc|hgnc.symbol):/i,"");
    }
    return fetch(`/api/search`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryClone)
    }).then(res => res.json());
  },

  searchGenes( query ){
    return fetch('/api/search/genes', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( { query } )
    }).then( res => res.json() );
  },

  enrichmentAPI(query, type){
    return fetch(`/api/enrichment/${type}`, {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    })
    .then(res => res.json());
  }
};

module.exports = ServerAPI;