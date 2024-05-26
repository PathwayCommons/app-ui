const fs = require('fs');
const path = require('path');
const qs = require('query-string');
const url = require('url');
const QuickLRU = require('quick-lru');
const _ = require('lodash');

const InvalidParamError = require('../errors/invalid-param');
const { cachePromise } = require('../cache');
const { fetch } = require('../../util');
const logger = require('../logger');
const config = require('../../config');
const { uri2filename } = require('../../util/uri.js');

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
  delete queryOpts.cmd; //not need to add the cmd as query parameters as well (it's part of URI)
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
  "homepageUrl",
  "iconUrl",
  "pubmedId",
  "numPathways",
  "numInteractions",
  "numPhysicalEntities"
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
 * Flexible enough to accommodate cases where 'name' varies in size.
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

// Fill in preview URL
const addPreviewUrl = function( searchHit ) {
  const { uri } = searchHit;
  const fname = uri2filename( uri );
  const fpath = path.resolve( config.SBGN_IMG_PATH, `${fname}.png` );
  const hasImage = fs.existsSync( fpath );
  if ( hasImage ){
    const previewUrl = fpath.split( path.sep ).slice(-3).join(path.sep);
    searchHit.previewUrl = previewUrl;
  }
  return searchHit;
};

const augmentSearchHits = async function( searchHits ) {
  if( searchHits.length ) addPreviewUrl( searchHits[0] );
  const dataSources = await getDataSourcesMap();
  return Promise.all( searchHits.map( searchHit => addSourceInfo( searchHit, dataSources ) ) );
};

// Feature a search hit
const getFeature = async searchHits => {
  let feature = null;

  const formatAuthorInfo = ({ authorProfiles = [] }) => {
    const profile2Info = ({ name, orcid }) => ({
      label: name,
      url: orcid ? `${config.ORCID_BASE_URL}${orcid}` : null
    });
    return authorProfiles.map( profile2Info );
  };

  const formatEntityInfo = ({ elements = [] }) => {
    const isGroundedEntity = e => _.has( e, ['association', 'id'] );
    const unique = c => _.uniqBy( c, 'association.id' );
    const entity2Info = ({ name: given, association: { id, dbPrefix, organismName } }) => {
      let label = given;
      const url = `${config.IDENTIFIERS_URL}/${dbPrefix}:${id}`;
      return { label, url, organismName, dbPrefix };
    };
    const groundedEntities = elements.filter( isGroundedEntity );
    const uniqueEntities = unique( groundedEntities );
    return uniqueEntities.map( entity2Info );
  };

  const formatArticleInfo = ({ citation }) => {
    let doiUrl = null;
    let pubmedUrl = null;
    const { title, reference, pmid, doi } = citation;
    if( doi ){
      doiUrl = `${config.DOI_BASE_URL}${doi}`;
    }
    if ( pmid ) {
      pubmedUrl = `${config.IDENTIFIERS_URL}/${config.NS_PUBMED}:${pmid}`;
    }
    let authors = _.get( citation, ['authors', 'abbreviation'], null );
    return ({ title, doiUrl, pubmedUrl, authors, reference });
  };

  const formatPathwayInfo = ( raw, searchHit ) => {
    const info = [];
    const { id, caption, elements, text: interactions, citation: { title } } = raw;
    const genes = elements.map( ({ association }) => association ).filter( ({ dbPrefix }) => dbPrefix === config.NS_NCBI_GENE );
    const orgs = _.groupBy( genes, g => g.organismName );
    const orgCounts = _.toPairs( orgs ).map( ([org, entries]) => [org, entries.length] );
    // eslint-disable-next-line no-unused-vars
    const maxOrgs = _.maxBy( orgCounts, ([org, count]) => count );
    const organism = maxOrgs && maxOrgs.length ? _.first( maxOrgs ) : null;
    const parts = [{ title: 'Interactions', body: interactions }];
    if( caption ) parts.unshift( { title: 'Context', body: caption } );

    info.push({
      db: config.NS_BIOFACTOID,
      url: `${config.FACTOID_URL}document/${id}`,
      imageSrc: `${config.FACTOID_URL}api/document/${id}.png`,
      label: title,
      text: parts,
      organism
    });

    const { uri, name } = searchHit;
    info.push({
      db: config.NS_PATHWAYCOMMONS,
      url: uri,
      imageSrc: null,
      label: name,
      text: null,
      organism
    });

    return info;
  };

  const formatFeatureInfo = ( raw, searchHit ) => ({
    'authors': formatAuthorInfo( raw ),
    'entities': formatEntityInfo( raw ),
    'article': formatArticleInfo( raw ),
    'pathways': formatPathwayInfo( raw, searchHit )
  });

  const getFeatureInfo = async ( id, searchHit ) => {
    const url = `${config.FACTOID_URL}api/document/${id}`;
    const res = await fetch( url, fetchOptions );
    const raw = await res.json();
    return formatFeatureInfo( raw, searchHit );
  };
  const topHit = _.first( searchHits );
  const shouldFeature = topHit && topHit.sourceInfo.identifier === config.NS_BIOFACTOID;

  if ( shouldFeature ){
    const featureHit = searchHits.shift();
    try {
      const ids = await traverse( featureHit.uri, 'Pathway/xref:UnificationXref/id' );
      const id = _.first( ids );
      feature = await getFeatureInfo( id, featureHit );
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

//for the /xref service api see:
// biopax.baderlab.org/docs/index.html (OLD/experimental Spring docs version)
// pathwaycommons.io/validate/swagger-ui/index.html#/suggester-controller/xref
const handleXrefServiceResponse = res => {
  const { values } = res;
  const xrefInfo = _.head( values ); //use top/first item only
  if( !xrefInfo || !xrefInfo.uri) {
    logger.debug("no useful xref");
    return null;
  }
  const uri = new url.URL( xrefInfo.uri ); // Throws TypeError
  //valid url is like: http://bioregistry.io/<namespace>:<id> (older version - http://identifiers.org/<namespace>/<id>)
  const namespace = xrefInfo.namespace; //when xref.db was there recognized (see also: xrefInfo.dbOk and xrefInfo.idOk)
  return {
    origin: uri.origin,
    namespace
  };
};

const formatXrefQuery = ( name, localId ) => _.concat( [], { db: name, id: localId } );

/* fetchEntityUriBase
 * Wrapper around the BioPAX service to fetch URI
 * given the identifiers collection name and identifier of a bio entity;
 * @return { object } the URL origin and namespace
 */
const fetchEntityUriBase = ( name, localId ) => {
  const url = config.PC_URL + "validate/xref";
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
 * @param {string} name - identifiers collection name or synonym (from bioregistry.io), or CV term (a name/label from MI:0444 ontology subtree)
 * @param {string} localId - Entity local entity identifier, should be valid
 * @return {Object} return the origin and 'namespace' in path
 *
 * This could be updated to accept array of { name, localId } fields now....
 */
const xref2Uri =  ( name, localId ) => {
  return getEntityUriParts( name, localId )
    .then( uriParts => ({
      uri: uriParts.origin + '/' + uriParts.namespace + ':' + localId,
      namespace: uriParts.namespace
    }) );
};

module.exports = { query, search: cachedSearch, sifGraph, xref2Uri, getDataSources };