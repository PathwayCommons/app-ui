const qs = require('query-string');
const url = require('url');
const { fetch } = require('../../util');
const _ = require('lodash');
const logger = require('../logger');
const config = require('../../config');
const LRUCache = require('lru-cache');
const cache = require('../cache');
const pcCache = LRUCache({ max: config.PC_CACHE_MAX_SIZE, length: () => 1 });

const { validatorGconvert } = require('./gprofiler');


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

/* _fetchFromMiriamUri
 * Using (abusing) this service to get the MIRIAM collection namespace from a name
 * http://www.pathwaycommons.org/pc2/swagger-ui.html#!/metadata45controller/identifierOrgUriUsingGET
 * NB: Does do some regex pattern validation of localId?
 */
const _fetchFromMiriamUri = ( name, localId ) => {
  console.log(`_fetchFromMiriamUri -name: ${name}; localId: ${localId}`);
  const url = config.PC_URL + 'pc2/miriam/uri/' + name + '/' + localId + '/';
  return fetch( url , {
   method: 'GET',
   headers: {
     'Accept': 'text/plain'
   }
 })
 .then( res => res.text() )
 .catch( e => {
   logger.error( `_fetchFromMiriamUri with ${name} - ${e}` );
   throw e;
 });
};

// Obtain the last two path elements from uri (e.g. 'http://identifiers.org/namespace/localId')
const _namespaceFromUri = uri => {
  const uriParts = url.parse( uri );
  const pathParts = _.compact( uriParts.pathname.split('/') );
  return pathParts.length === 2 ? pathParts[0] : null;
};

const _rawGetNamespace = async ( name, localId ) => {
  const uri = await _fetchFromMiriamUri( name, localId );
  return _namespaceFromUri( uri );
};
const _getNamespace  = cache( _rawGetNamespace, pcCache );

const _constructUri = ( namespace, localId ) => `${ config.IDENTIFIERS_URL }/${ namespace }/${ localId }`;

/*
 * xref2Uri: Obtain the uri for an xref
 * @param {string} name -  MIRIAM 'name' OR MI CV database citation (MI:0444) 'label'
 * @param {string} localId - For a collection registered with MIRIAM
 * @return a uri
 */
const xref2Uri =  async ( name, localId ) => {
  const namespace = await _getNamespace( name, localId );
  const uri = _constructUri( namespace, localId );
  return uri;
};

const search = _.memoize(_search, query => JSON.stringify(query));

module.exports = { query, search, sifGraph, xref2Uri };