const qs = require('query-string');
const _ = require('lodash');
const { fetch } = require('../../../util');
const { PC_URL } = require('../../../config');

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
    let { type, uri, id } = opts;
    if( type === 'pathways' ){
      if( uri !== null ){
        return this.getPathway( uri );
      } else {
        throw new Error('Invalid parameter.  Pathways api calls require a uri parameter');
      }
    }
    if( type === 'factoids' ){
      if( id !== null ){
        return this.getFactoid(opts.id);
      } else {
        throw new Error('Invalid paramter. Factoids api calls require a id parameter');
      }
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
    const opts = _.assign({}, defaultFetchOpts, { method: 'POST', body: JSON.stringify( query ) });
    return fetch(absoluteURL(`/api/enrichment/${type}`), opts)
    .then(res => res.json());
  },

  geneQuery(query){
    return this.enrichmentAPI(query, "validation");
  },

  entitySummaryQuery( query ){
    return fetch(`/api/summary/entity/search?q=${ query }`)
    .then(res => res.json());
  }
};

module.exports = ServerAPI;