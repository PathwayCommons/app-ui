const fetch = require('node-fetch');
const _ = require('lodash');
const { validOrganism } = require('./validity-info');
const { validTargetDb } = require('./validity-info');
const qs = require('query-string');
const { cleanUpEntrez } = require('../helper');
const logger = require('./../../logger');
const config = require('../../../config');
const GCONVERT_URL = config.GPROFILER_URL + 'gconvert.cgi';
const FETCH_TIMEOUT = 5000; //ms
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE } = require('../../../config');
const pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

const resultTemplate = ( unrecognized, duplicate, geneInfo ) => {
  return {
    unrecognized: Array.from( unrecognized ) || [],
    duplicate: duplicate || {},
    geneInfo: geneInfo || []
  };
};

const mapDBNames = officalSynonym  => {
  officalSynonym = officalSynonym.toUpperCase();
  if ( officalSynonym === 'HGNCSYMBOL' ) { return 'HGNC'; }
  if ( officalSynonym === 'HGNC' ) { return 'HGNC_ACC'; }
  if ( officalSynonym === 'UNIPROT' ) { return 'UNIPROTSWISSPROT'; }
  if ( officalSynonym === 'NCBIGENE' ) { return 'ENTREZGENE_ACC'; }
  return officalSynonym;
};

/*
 * getForm
 * @param { array } query - Gene IDs
 * @param { object } userOptions
 * @returns { object } error and form
 */
const getForm = ( query, defaultOptions, userOptions ) => {

  const form = _.assign( {},
    defaultOptions,
    JSON.parse( JSON.stringify( userOptions ) ),
    { query: query }
  );

  if (!Array.isArray( form.query )) {
    throw new Error( 'Invalid genes: Must be an array' );
  }
  if ( !validOrganism.includes( form.organism.toLowerCase() ) ) {
    throw new Error( 'Invalid organism' );
  }
  if ( !validTargetDb.includes( form.target.toUpperCase() ) ) {
    throw new Error( 'Invalid target' );
  }

  form.target = mapDBNames( form.target );
  form.query = form.query.join(" ");

  return form;
};

const bodyHandler = body =>  {
  const geneInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
  geneInfoList.splice(-1, 1); // remove last element ''
  const unrecognized = new Set();
  let duplicate = {};
  const previous = new Map();
  let geneInfo = new Set();
  const initialAliasIndex = 1;
  const convertedAliasIndex = 3;
  _.forEach(geneInfoList, info => {
    const convertedAlias = info[convertedAliasIndex];
    let initialAlias = info[initialAliasIndex];
    initialAlias = cleanUpEntrez(initialAlias);
    if (convertedAlias === 'N/A') {
      unrecognized.add(initialAlias);
    } else {
      if (!previous.has(convertedAlias)) {
        previous.set(convertedAlias, initialAlias);
      } else {
        if (!(convertedAlias in duplicate)) {
          duplicate[convertedAlias] = new Set([previous.get(convertedAlias)]);
        }
        duplicate[convertedAlias].add(initialAlias);
      }
      geneInfo.add(JSON.stringify({initialAlias: initialAlias, convertedAlias: convertedAlias}));
    }
  });
  for (const initialAlias in duplicate) {
    duplicate[initialAlias] = Array.from(duplicate[initialAlias]);
  }
  geneInfo = _.map(Array.from(geneInfo), ele => { return JSON.parse(ele); });
  return resultTemplate( unrecognized, duplicate, geneInfo );
};

/* errorHandler
 * This function routes errors in a rational manner: Fetch-related errors are gently handled
 * by returning the original gene list as 'unrecognized'; For input errors, the Promise is
 * rejected with the error info for the client; in all other cases an Error is thrown.
 * @param { object } data - Error object and query (optional)
 * @return { Promise }
 */
const errorHandler = ( error, query ) => {
  logger.error( error );
  // something fishy - blow out the cache
  pcCache.reset();
  switch ( error.name ) {
    case 'FetchError':
      return new Promise( resolve => resolve( resultTemplate( query ) ) );
    default:
      return new Promise( ( _, reject ) => reject( { "Error": error.message } ) );
  }
};


/* rawValidatorGconvert
 * @param { array } query - identifier list query
 * @param { object } userOptions - options
 * @return { object } list of unrecognized, object with duplicated and list of mapped IDs
 */
const rawValidatorGconvert = ( query, userOptions ) => {

  const defaultOptions = {
    'output': 'mini',
    'organism': 'hsapiens',
    'target': 'HGNC',
    'prefix': 'ENTREZGENE_ACC'
  };

  return new Promise(( resolve, reject ) => {

    const form = getForm( query, defaultOptions, userOptions );
    fetch( GCONVERT_URL, {
        method: 'post',
        body: qs.stringify( form ),
        timeout: FETCH_TIMEOUT
    })
    .then( response => response.text() )
    .then( bodyHandler )
    .then( resolve )
    .catch( reject );
  })
  .catch( error => errorHandler( error, query ) );
};

const validatorGconvert = cache(rawValidatorGconvert, pcCache);

module.exports = { validatorGconvert };
