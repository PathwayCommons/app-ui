const qs = require('query-string');
const url = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');

const cache = require('../cache');
const { fetch } = require('../../util');
const logger = require('../logger');
const config = require('../../config');

const xrefCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });
const queryCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });

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

// A wrapper for PC web services search.
// The argument (query object) has the following fields:
//  - q: user input - search query string
//  - type: BioPAX type to match/filter by
let search = async opts => {
  let queryOpts = _.assign( opts, { cmd: 'pc2/search' } );
  let searchResult = await query( queryOpts );
  let searchResults = _.get( searchResult, 'searchHit', []).filter( result => {
    let size = _.get( result, 'numParticipants', 0);
    return size > 0;
  });
  return searchResults;
};

const cachedSearch = cache(search, queryCache);

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

const getEntityUriParts = cache(fetchEntityUriBase, xrefCache, name => name);

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

module.exports = { query, search: cachedSearch, sifGraph, xref2Uri };