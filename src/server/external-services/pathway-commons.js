const qs = require('query-string');
const url = require('url');
const LRUCache = require('lru-cache');
const _ = require('lodash');

const { fetch } = require('../../util');
const logger = require('../logger');
const config = require('../../config');
const { validatorGconvert } = require('./gprofiler');

const pcCache = LRUCache({ max: config.PC_CACHE_MAX_SIZE, length: () => 1 });

const fetchOptions = {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const _sanitize = (s) => {
  // Escape (with '\'), to treat them literally, symbols, such as '*', ':', or space,
  // which otherwise play special roles in a Lucene query string.
  return s.replace(/([!*+\-&|()[\]{}^~?:/\\"\s])/g, '\\$1');
};

const _processPhrase = (phrase) => {
  return validatorGconvert(phrase.split(' '),{}).then(result => {
    let { unrecognized, alias  } = result;
    const entities = _.keys( alias ).map( initialAlias =>'xrefid:' + _sanitize( initialAlias.toUpperCase()) );
    const otherIds = unrecognized.map(id=>{
      id=id.toUpperCase();
      const recognized = /^SMP\d{5}$/.test(id) // check for a smpdb or chebi id
        ||/^CHEBI:\d+$/.test(id) && (id.length <= ("CHEBI:".length + 6));
      const sanitized = _sanitize(id);
      return recognized ? ( 'xrefid:' + sanitized ) : ( 'name:' + '*' + sanitized + '*' );
    });
    return entities.concat(otherIds);
  });
};

const _processQueryString = async (inputString) => {
  const keywords = await _processPhrase(inputString);
  const phrase = _sanitize(inputString);
  // return three search query candidates: the first one is the fastest, the last - slowest
  return [
    '(name:' + phrase + ') OR (' + 'name:*' + phrase + '*) OR (' + keywords.join(' AND ') + ')',
    '(' + keywords.join(' OR ') + ')',
    inputString //"as is" (won't additionally escape Lucene query syntax, spaces, etc.)
  ];
};

//Pathway Commons HTTP GET request; options.cmd = 'pc2/get', 'pc2/search', 'pc2/traverse', 'pc2/graph', etc.
const query = async (queryObj) => {
  queryObj.user = 'app-ui';
  let cmd = queryObj.cmd || 'pc2/get';
  //TODO: (not critical) client app's sends useless parameters to the PC server: cmd, lt, gt
  const url = config.PC_URL + cmd + '?' + qs.stringify(queryObj);
  return fetch(url, fetchOptions)
    .then(res => (cmd=='pc2/get'||cmd=='pc2/graph')?res.text():res.json())
    .catch((e) => {
      logger.error('query ' + queryObj + ' failed - ' + e);
      return null;
    });
};

// A fine-tuned PC search to improve relevance of full-text search and filter out unwanted hits.
// The argument (query object) has the following fields:
//  - q: user input - search query string
//  - type: BioPAX type to match/filter by
//  - lt: max graph size result returned
//  - gt: min graph size result returned
const _search = async (args) => {
  const minSize = args.gt || 0;
  const maxSize = args.lt || 250;
  //analyse the input string, generate specific (lucene) search sub-queries
  const queryString = args.q.trim();
  const queries = await _processQueryString(queryString);
  for (let q of queries) {
    args.cmd = 'pc2/search'; //PC command
    args.q = q; //override initial query.q string with the sub-query q
    const searchResult = await query(args); //up to 100 hits at once; if we need more, then must use 'page' parameter...
    const searchSuccess = searchResult != null;
    if (searchSuccess && searchResult.searchHit.length > 0) {
      const filteredResults = searchResult.searchHit.filter(hit => {
        const size = hit.numParticipants ? hit.numParticipants : 0;
        return minSize < size && size < maxSize;
      });
      if (filteredResults.length > 0) {
        return filteredResults;
      }
    }
  }

  return [];
};

const sifGraph = async ( queryObj ) => {
  let path;
  const defaults = {
    limit: 1,
    pattern: ['CONTROLS_STATE_CHANGE_OF','CONTROLS_TRANSPORT_OF','CONTROLS_EXPRESSION_OF','CATALYSIS_PRECEDES','INTERACTS_WITH']
  };
  const params = _.assign(defaults, queryObj);

  if ( params.source.length > 1 ){
    path = 'pathsbetween';
    params.directed = 'false';
  } else {
    path = 'neighborhood';
    params.direction = 'UNDIRECTED';
  }

  const url = config.PC_URL + 'sifgraph/v1/' + path + '?' + qs.stringify(params);
  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/plain'
    }
  })
  .then( res => res.text() )
  .catch( e => {
    logger.error('sifGraph ' + queryObj + ' failed - ' + e);
    throw e;
  });
};

const handleEntityUriResponse = text => {
  const uri = new url.URL( text ); // Throws TypeError
  const pathParts = _.compact( uri.pathname.split('/') );
  if( _.isEmpty( pathParts ) || pathParts.length !== 2 ) throw new Error( 'Unrecognized URI' );
  const namespace = _.head( pathParts );
  return {
    origin: uri.origin,
    namespace
  };
};

const constructQueryPath = ( name, localId ) => {
  // Edge case - localId has periods e.g. 'enzyme nomenclature/6.1.1.5' gotta add a trailing slash
  const suffix = /\./.test( localId ) ? '/' : '';
  return name + '/' + localId + suffix;
};

/* fetchEntityUriBase
 * Light wrapper around the pc2 service to get the uri given a collection name and local ID for entity
 * http://www.pathwaycommons.org/pc2/swagger-ui.html#!/metadata45controller/identifierOrgUriUsingGET
 * NB: pc2 service returns 200 and empty body if collection name and/or local ID are unrecognized.
 *   If the local ID is empty, throws a 404
 * @return { object } the URL origin and namespace
 */
const fetchEntityUriBase = ( name, localId ) => {
  const url = config.PC_URL + 'pc2/miriam/uri/' + constructQueryPath( name, localId ) ;
  return fetch( url , { method: 'GET', headers: { 'Accept': 'text/plain' } })
    .then( res => res.text() )
    .then( handleEntityUriResponse );
};

const getEntityUriParts = ( name, localId ) => {
  if( pcCache.has( name ) ){
    return pcCache.get( name );
  } else {
    let res = fetchEntityUriBase( name, localId );
    pcCache.set( name, res );
    res.catch( err => {
      pcCache.del( name );
      logger.error(`Failed to fill cache with ${name} and ${localId} - ${err}`);
    });
    return res;
  }
};

/*
 * xref2Uri: Obtain the URI for an xref
 * @param {string} name -  MIRIAM 'name', 'synonym' ?OR MI CV database citation (MI:0444) 'label'
 * @param {string} localId - Entity local entity identifier, should be valid
 * @return {Object} return the origin and 'namespace' in path
 */
const xref2Uri =  ( name, localId ) => {
  return getEntityUriParts( name, localId )
    .then( uriParts => ({
      uri: uriParts.origin + '/' + uriParts.namespace + '/' + localId,
      namespace: uriParts.namespace
    }) );
};

const search = _.memoize(_search, query => JSON.stringify(query));

module.exports = { query, search, sifGraph, xref2Uri };