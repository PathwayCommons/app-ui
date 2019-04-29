const _ = require('lodash');
const QuickLRU = require('quick-lru');
const logger = require('../../../logger');

const { fetch } = require('../../../../util');
const InvalidParamError = require('../../../../server/errors/invalid-param');
const { GPROFILER_URL, PC_CACHE_MAX_SIZE, NS_HGNC, NS_HGNC_SYMBOL, NS_UNIPROT, NS_NCBI_GENE, NS_ENSEMBL } = require('../../../../config');
const { cachePromise } = require('../../../cache');
const GCONVERT_URL = GPROFILER_URL + 'api/convert/convert/';

const GPROFILER_NS_MAP = new Map([
  [NS_HGNC, 'HGNC_ACC'],
  [NS_HGNC_SYMBOL, 'HGNC'],
  [NS_UNIPROT, 'UNIPROTSWISSPROT'],
  [NS_NCBI_GENE, 'ENTREZGENE_ACC'],
  [NS_ENSEMBL, 'ENSG']
]);

const toJSON = res => res.json();

// create gconvert opts for a gconvert request
// validates params
const createGConvertOpts = opts => {
  // see https://biit.cs.ut.ee/gprofiler/page/apis
  const defaults = {
    organism: 'hsapiens',
    target: NS_HGNC,
    numeric_ns: 'ENTREZGENE_ACC'
  };
  const target = GPROFILER_NS_MAP.get(  _.get( opts, ['targetDb'], defaults.target ) );
  const query = _.get( opts, ['query'] );
  let gConvertOpts = _.assign( {}, defaults, { query, target } );
  
  if( !Array.isArray( query ) ){
    throw new InvalidParamError( `Error creating gconvert request - expected an array of strings for "query", got ${query}`);
  }

  if( target == null ){
    throw new InvalidParamError( `Error creating gconvert request - expected a valid "targetDb", got ${target}`);
  }
  
  return gConvertOpts;
};

const gConvertResponseHandler = json =>  {
  let entityInfoList = _.get( json, ['result'] );
  let unrecognized = new Set();
  let duplicate = {};
  let entityMap = new Map();
  let alias = {};

  entityInfoList.forEach( entityInfo => {
    let convertedAlias = entityInfo.converted === 'None' ? null : entityInfo.converted;
    let initialAlias = entityInfo.incoming;

    if( _.isNull( convertedAlias ) ){
      unrecognized.add( initialAlias );
      return;
    }

    if( !entityMap.has( convertedAlias ) ){
      entityMap.set( convertedAlias, initialAlias );
    } else {
      if( duplicate[ convertedAlias ] == null ){
        duplicate[ convertedAlias ] = new Set([entityMap.get( convertedAlias )]);
      }
      duplicate[ convertedAlias ].add( initialAlias );
    }

    alias[ initialAlias ] = convertedAlias;
  } );

  Object.keys( duplicate ).forEach( key => {
    duplicate[ key ] = Array.from( duplicate[ key ] ); // turn each set into a array for serialization
  } );

  return {
    unrecognized: Array.from( unrecognized ) || [],
    duplicate: duplicate || {},
    alias: alias || {}
  };
};



/* rawValidatorGconvert
 * @param { array } query - identifier list query
 * @param { object } userOptions - options
 * @return { object } list of unrecognized, object with duplicated and list of mapped IDs
 */
const rawValidatorGconvert = ( query, opts = {} ) => {
  return Promise.resolve()
    .then( () => createGConvertOpts( _.assign(opts, { query }) ) )
    .then( gconvertOpts => fetch( GCONVERT_URL, {
      method: 'post',
      body: JSON.stringify( gconvertOpts ),
      headers: { 'Content-Type': 'application/json' }
    }))
    .then( toJSON )
    .then( gConvertResponseHandler )
    .catch( err => {
      logger.error(`Error in validatorGconvert - ${err.message}`);
      throw err;
    });
};

const pcCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });

const validatorGconvert = cachePromise(rawValidatorGconvert, pcCache);

module.exports = {
  validatorGconvert,
  createGConvertOpts,
  gConvertResponseHandler,
  GPROFILER_NS_MAP
};
