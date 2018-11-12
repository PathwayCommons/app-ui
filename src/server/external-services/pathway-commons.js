const qs = require('query-string');
const url = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');

const { fetch } = require('../../util');
const logger = require('../logger');
const config = require('../../config');
const { validatorGconvert } = require('./gprofiler');

const pcCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });

const fetchOptions = {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

//Pathway Commons HTTP GET request; options.cmd = 'pc2/get', 'pc2/search', 'pc2/traverse', 'pc2/graph', etc.
let query = opts => {
  let queryOpts = _.assign( { user: 'app-ui', cmd: 'pc2/get' }, opts);
  let { cmd } = queryOpts;
  let url = config.PC_URL + cmd + '?' + qs.stringify( queryOpts );

  return fetch(url, fetchOptions)
    .then(res => ( cmd === 'pc2/get' || cmd === 'pc2/graph' ? res.text() : res.json() ) )
    .catch((e) => {
      logger.error('query ' + queryOpts + ' failed - ' + e);
      return null;
    });
};

let sanitize = s => {
  // Escape (with '\'), to treat them literally, symbols, such as '*', ':', or space,
  // which otherwise play special roles in a Lucene query string.
  return s.replace(/([!*+\-&|()[\]{}^~?:/\\"\s])/g, '\\$1');
};


// recognize biological entities from an input string
let extractEntityIds = inputString => {
  let tokens = inputString.split(' ');

  return validatorGconvert( tokens ).then( result => {
    let { unrecognized, alias  } = result;
    let entities = _.keys( alias ).map( initialAlias => 'xrefid:' + sanitize( initialAlias.toUpperCase() ) );

    let otherIds = unrecognized.map( id => {
      id = id.toUpperCase();
      let isChebiId = /^CHEBI:\d+$/.test( id );
      let isSmpdbId = /^SMP\d{5}$/.test( id );
      let recognized = isSmpdbId || isChebiId && ( id.length <= ("CHEBI:".length + 6) );
      let sanitized = sanitize(id);

      return recognized ? ( 'xrefid:' + sanitized ) : ( 'name:' + '*' + sanitized + '*' );
    });

    return entities.concat(otherIds);
  })
  .catch( e => {
    logger.error('unable to get response from gconvert with the following inputstring: ' + inputString);
    logger.error(e);
    // luncene each token in place of recognized entities
    return tokens.map( token => 'name:' + '*' + sanitize(token) + '*');
  });
};

// generate three search query candidates: the first one is the fastest, the last - slowest
let generateSearchQueries = async inputString => {
  let phrase = sanitize( inputString );
  let entities = await extractEntityIds( inputString );
  return [
    '(name:' + phrase + ') OR (' + 'name:*' + phrase + '*) OR (' + entities.join(' AND ') + ')',
    '(' + entities.join(' OR ') + ')',
    inputString //"as is" (won't additionally escape Lucene query syntax, spaces, etc.)
  ];
};

// A fine-tuned PC search to improve relevance of full-text search and filter out unwanted hits.
// The argument (query object) has the following fields:
//  - q: user input - search query string
//  - type: BioPAX type to match/filter by
//  - lt: max graph size result returned
//  - gt: min graph size result returned
let search = async opts => {
  let { gt:minSize = 0, lt:maxSize = 250, q } = opts;
  let queryStrings = await generateSearchQueries( q.trim() );

  for( let queryString of queryStrings ) {
    let queryOpts = _.assign( opts, { cmd: 'pc2/search', q: queryString } );
    let searchResult = await query( queryOpts );
    let searchResults = _.get( searchResult, 'searchHit', []).filter( result => { 
      let size = _.get( result, 'numParticipants', 0);

      return minSize < size && size < maxSize;
    });

    if ( searchResults.length > 0 ){
      return searchResults;
    }

  }

  return [];
};

const sifGraph = opts => {
  let hasMultipleSources = _.get(opts, 'source', []).length > 1;
  let sifGraphType = hasMultipleSources ? 'pathsbetween' : 'neighborhood';
  let queryOpts = Object.assign( {}, opts, {
    limit: 1,
    pattern: ['CONTROLS_STATE_CHANGE_OF','CONTROLS_TRANSPORT_OF','CONTROLS_EXPRESSION_OF','CATALYSIS_PRECEDES','INTERACTS_WITH'],
    directed: hasMultipleSources ? 'false' : undefined,
    direction: hasMultipleSources ? undefined : 'UNDIRECTED'
  });
  let url = config.PC_URL + 'sifgraph/v1/' + sifGraphType + '?' + qs.stringify( queryOpts );

  return fetch( url, { method: 'GET', headers: { 'Accept': 'text/plain' } } )
  .then( res => res.text() )
  .catch( e => {
    logger.error( 'sifGraph ' + opts + ' failed - ' + e );
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
      pcCache.delete( name );
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


module.exports = { query, search: _.memoize( search, query => JSON.stringify( query ) ), sifGraph, xref2Uri };