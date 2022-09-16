const qs = require('query-string');
const url = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');

const InvalidParamError = require('../errors/invalid-param');
const { cachePromise } = require('../cache');
const { fetch } = require('../../util');
const logger = require('../logger');
const config = require('../../config');

const xrefCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });
const queryCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });
const traverseCache = new QuickLRU({ maxSize: config.PC_CACHE_MAX_SIZE });

const fetchOptions = {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const toJSON = res => res.json();

//Pathway Commons HTTP GET request; options.cmd = 'pc2/get', 'pc2/search', 'pc2/traverse', 'pc2/graph', etc.
let query = opts => {
  let queryOpts = _.assign( { user: 'app-ui', cmd: 'pc2/get' }, opts);
  let { cmd } = queryOpts;
  let url = config.PC_URL + cmd + '?' + qs.stringify( queryOpts );

  return fetch(url, fetchOptions)
    .then(res => ( cmd === 'pc2/get' || cmd === 'pc2/graph' ? res.text() : res.json() ) )
    .catch( e => {
      logger.error('query ' + queryOpts + ' failed - ' + e);
      throw e;
    });
};

// Simple wrapper for traversal over object given URI
const traverseRaw = ( uri, path ) => query({ cmd:'pc2/traverse', uri, path })
    .then( data => _.get( data, [ 'traverseEntry', '0', 'value' ], null ) );
const traverse = cachePromise( traverseRaw, traverseCache );

let dataSourcesCache = null;
const dataSourceFields = [
  "identifier",
  "name",
  "description",
  "urlToHomepage",
  "iconUrl",
  "pubmedId",
  "numPathways",
  "numInteractions",
  "numPhysicalEntities",
  "notPathwayData"
];
const sortByLength = arr => arr.sort( ( a, b ) => b.length - a.length );
/**
 * getDataSourcesMap
 * Get a Map of info for datasources
 * @returns { Map } Keys are lowercased names (Provenance standard / display)
 * Values not guaranteed to be unique
 */
const getDataSourcesMap = async function() {
  if( dataSourcesCache ) return dataSourcesCache;
  // Initialize the dataSourcesCache
  const sourceMap = new Map();
  const datasources = await query({ cmd:'pc2/metadata/datasources' });
  datasources.forEach( source => {
    const name = _.head( sortByLength( source.name ) ); // Use longest name for display
    const sourceInfo = _.assign( _.pick( source, dataSourceFields ), { name }, { alias: source.name } );
    source.name.forEach( variant => sourceMap.set( _.toLower( variant ), sourceInfo ) );
  });
  dataSourcesCache = sourceMap;
  return sourceMap;
};
/**
 * dataSources
 * Get a list of info for each datasource, unique with respect to identifier
 * @returns { Array } Each object is info for each source with dataSourceFields
 */
const getDataSources = () => getDataSourcesMap().then( dsMap => _.uniqBy( [ ...dsMap.values() ], o => o.identifier ) );

/**
 * getDataSourceInfo
 * Find first instance of dataSource that matches any elements of an array of 'names'.
 * Flexible enough to accomodate cases where 'name' varies in size.
 * @param { Array } Strings of dataSource names
 * @param { Map } The dataSource Map
 * @returns { Object } Various dataSource fields (see dataSourceFields)
 */
const getDataSourceInfo = ( name, dataSources ) => {
  for ( const variant of name ){
    const dsInfo = dataSources.get( _.toLower( variant ) );
    if( dsInfo ) return dsInfo;
  }
};

// Fill the dataSource information
const addSourceInfo = async function( searchHit, dataSources ) {
  const uri = _.get( searchHit, [ 'dataSource', '0' ] );
  const name = await traverse( uri, 'Named/name' );
  const sourceInfo = getDataSourceInfo( name, dataSources );
  if ( sourceInfo ) _.assign( searchHit, { sourceInfo } );
  return searchHit;
};

const augmentSearchHits = async function( searchHits ) {
  const dataSources = await getDataSourcesMap();
  return Promise.all( searchHits.map( searchHit => addSourceInfo( searchHit, dataSources ) ) );
};

// Feature a search hit
const getFeature = async searchHits => {
  let feature = null;

  const formatAuthorInfo = () => {
    const info = [];

    return info;
  };

  const formatEntityInfo = ({ elements = [] }) => {
    const isGroundedEntity = e => _.has( e, ['association', 'id'] );
    const unique = c => _.uniqBy( c, 'association.id' );
    const entity2Info = ({ association: { id, dbPrefix, name } }) => ({
      name,
      url: `${config.IDENTIFIERS_URL}/${dbPrefix}:${id}`
    });

    const groundedEntities = elements.filter( isGroundedEntity );
    const uniqueEntities = unique( groundedEntities );
    return uniqueEntities.map( entity2Info );
  };

  const formatArticleInfo = ({ citation }) => {
    let url = null;
    const { title, reference, pmid, doi } = citation;
    if( doi ){
      url = `${config.DOI_BASE_URL}${doi}`;
    } else if ( pmid ) {
      url = `${config.IDENTIFIERS_URL}/${config.NS_PUBMED}:${pmid}`;
    }
    let authors = _.get( citation, ['authors', 'abbreviation'], null );
    return ({ title, url, authors, reference });
  };

  const formatPathwayInfo = () => {
    const info = [];
    return info;
  };

  const formatFeatureInfo = raw => {
    const info = {
      'authors': formatAuthorInfo( raw ),
      'entities': formatEntityInfo( raw ),
      'article': formatArticleInfo( raw )
    };
    return info;
  };

  const getFeatureInfo = async id => {
    const url = `${config.FACTOID_URL}api/document/${id}`;
    const res = await fetch( url, fetchOptions );
    const raw = await res.json();
    return formatFeatureInfo( raw );
  };
  const topHit = _.first( searchHits );
  const shouldFeature = topHit && topHit.sourceInfo.identifier === config.NS_BIOFACTOID;

  if ( shouldFeature ){
    const featureHit = searchHits.shift();
    try {
      const ids = await traverse( featureHit.uri, 'Pathway/xref:UnificationXref/id' );
      const id = _.first( ids );
      feature = await getFeatureInfo( id );
      const pathwayInfo = formatPathwayInfo( featureHit );
      _.set( feature, 'pathways', pathwayInfo );
    } catch (err) { // swallow errors
      logger.error('Failed to get feature - ' + err);
    }
  }
  return feature;
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
  const searchHits = await augmentSearchHits( searchResults );
  const feature = await getFeature( searchHits );
  return ({ searchHits, feature });
};

const cachedSearch = cachePromise(search, queryCache);

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
    logger.error(url + ' failed - ' + e );
    throw e;
  });
};

const handleXrefServiceResponse = res => {
  const { values } = res;
  const xrefInfo = _.head( values );
  const uri = new url.URL( xrefInfo.uri ); // Throws TypeError
  const pathParts = _.compact( uri.pathname.split('/') );
  if( _.isEmpty( pathParts ) || pathParts.length !== 2 ) throw new Error( 'Unrecognized URI' );
  const namespace = _.head( pathParts );
  return {
    origin: uri.origin,
    namespace
  };
};

const formatXrefQuery = ( name, localId ) => _.concat( [], { db: name, id: localId } );

/* fetchEntityUriBase
 * Light wrapper around the BioPAX service to fetch URI given a collection name and local ID for entity
 * http://biopax.baderlab.org/docs/index.html#_introduction
 * @return { object } the URL origin and namespace
 */
const fetchEntityUriBase = ( name, localId ) => {
  const url = config.XREF_SERVICE_URL + 'xref/';
  const fetchOpts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body:  JSON.stringify( formatXrefQuery( name, localId ) )
  };
  return fetch( url , fetchOpts )
    .then( toJSON )
    .then( handleXrefServiceResponse )
    .catch( error => {
      if( error instanceof TypeError ) throw new InvalidParamError('Unrecognized parameters');
      throw error;
    });
};

const getEntityUriParts = cachePromise(fetchEntityUriBase, xrefCache, name => name);

/*
 * xref2Uri
 * Obtain the URI for an xref
 * @param {string} name -  MIRIAM 'name', 'synonym' ?OR MI CV database citation (MI:0444) 'label'
 * @param {string} localId - Entity local entity identifier, should be valid
 * @return {Object} return the origin and 'namespace' in path
 *
 * This could be updated to accept array of { name, localId } fields now....
 */
const xref2Uri =  ( name, localId ) => {
  return getEntityUriParts( name, localId )
    .then( uriParts => ({
      uri: uriParts.origin + '/' + uriParts.namespace + '/' + localId,
      namespace: uriParts.namespace
    }) );
};

module.exports = { query, search: cachedSearch, sifGraph, xref2Uri, getDataSources };