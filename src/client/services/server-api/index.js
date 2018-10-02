const qs = require('query-string');
const _ = require('lodash');

const { PC_URL } = require('../../../config');

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
  // a generic method that gets pathway sbgn json from various sources
  // e.g. pathwaycommons, factoid, or human created layouts
  getAPIResource(opts){
    let { type } = opts;
    if( type === 'pathways' ){
      return this.getPathway(opts.uri);
    }
    if( type === 'factoids' ){
      return this.getFactoid(opts.id);
    }
  },

  getPathway(uri) {
    let url = absoluteURL(`/api/pathways?${ qs.stringify({ uri }) }`);
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

  getFactoids() {
    return (
      fetch('/api/factoids', defaultFetchOpts)
        .then( res => res.json() )
    );
  },

  getFactoid(id) {
    let url = absoluteURL(`/api/factoids/${ id }`);
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
      fetch(absoluteURL(`/api/interactions?${qs.stringify(sources)}`), defaultFetchOpts)
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
    return fetch(`https://www.ebi.ac.uk/QuickGO/services/ontology/go/search?query=GO%3A${goID}&limit=1&page=1`, {method: 'GET', timeout: 100})
    .then( res => res.json() );
  },

  getReactomeInformation(reactomeID) {
    return fetch(`https://reactome.org/ContentService/data/query/${reactomeID}`, {method: 'GET', timeout: 100})
    .then( res => res.json() );
  },

  downloadFileFromPathwayCommons( uri, format ){
    return fetch(PC_URL + 'pc2/get?' + qs.stringify({ uri, format}), defaultFetchOpts);
  },

  search(query){
    const queryClone=_.assign({},query);
    if (/^((uniprot|hgnc):\w+|ncbi:[0-9]+)$/i.test(queryClone.q)) {
      queryClone.q=queryClone.q.replace(/^(uniprot|ncbi|hgnc):/i,"");
    }
    return fetch(absoluteURL(`/api/pc/search?${qs.stringify(queryClone)}`), defaultFetchOpts).then(res => res.json());
  },

  enrichmentAPI(query, type){
    return fetch(absoluteURL(`/api/enrichment/${type}`), {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query),
      timeout: FETCH_TIMEOUT
    })
    .then(res => res.json());
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
  }
};

module.exports = ServerAPI;