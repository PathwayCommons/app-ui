const { fetch } = require('../../../../util');
const _ = require('lodash');
const qs = require('query-string');
const LRUCache = require('lru-cache');
const InvalidParamError = require('../../../errors/invalid-param');
const logger = require('../../../logger');

const { organisms, targetDatabases } = require('./gconvert-config');
const cleanUpEntrez = require('../clean-up-entrez');
const  { DATASOURCE_NAMES } = require('../../../../models/entity/summary.js');

const { GPROFILER_URL, PC_CACHE_MAX_SIZE } = require('../../../../config');
const cache = require('../../../cache');

const GCONVERT_URL = GPROFILER_URL + 'gconvert.cgi';
// const GCONVERT_URL = 'https://httpstat.us/504';

const resultTemplate = ( unrecognized, duplicate, alias ) => {
  return {
    unrecognized: Array.from( unrecognized ) || [],
    duplicate: duplicate || {},
    alias: alias || {}
  };
};

const mapDBNames = officalSynonym  => {
  officalSynonym = officalSynonym.toUpperCase();
  if ( officalSynonym === DATASOURCE_NAMES.HGNC_SYMBOL.toUpperCase() ) { return 'HGNC'; }
  if ( officalSynonym === DATASOURCE_NAMES.HGNC.toUpperCase() ) { return 'HGNC_ACC'; }
  if ( officalSynonym === DATASOURCE_NAMES.UNIPROT.toUpperCase() ) { return 'UNIPROTSWISSPROT'; }
  if ( officalSynonym === DATASOURCE_NAMES.NCBI_GENE.toUpperCase() ) { return 'ENTREZGENE_ACC'; }
  if ( officalSynonym === DATASOURCE_NAMES.ENSEMBL.toUpperCase() ) { return 'ENSG'; }
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
    throw new InvalidParamError( 'Query must be an array' );
  }
  if ( !organisms.includes( form.organism.toLowerCase() ) ) {
    throw new InvalidParamError( 'Unrecognized organism' );
  }
  if ( !targetDatabases.map( s => s.toUpperCase() ).includes( form.target.toUpperCase() ) ) {
    throw new InvalidParamError( 'Unrecognized targetDb' );
  }

  form.target = mapDBNames( form.target );
  form.query = form.query.join(" ");

  return form;
};

const bodyHandler = body =>  {

  const entityInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
  entityInfoList.splice(-1, 1); // remove last element ''
  const unrecognized = new Set();
  let duplicate = {};
  const previous = new Map();
  let alias = {};
  const initialAliasIndex = 1;
  const convertedAliasIndex = 3;
  _.forEach(entityInfoList, info => {
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
      alias[initialAlias] = convertedAlias;
    }
  });
  for (const initialAlias in duplicate) {
    duplicate[initialAlias] = Array.from(duplicate[initialAlias]);
  }
  return resultTemplate( unrecognized, duplicate, alias );
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

  const form = getForm( query, defaultOptions, userOptions );

  return fetch( GCONVERT_URL, {
      method: 'post',
      body: qs.stringify( form )
  })
  .catch(err => {
    logger.error(`Gprofiler convert query failed`);

    throw err;
  })
  .then( response => response.text() )
  .then( bodyHandler );
};

const pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

const validatorGconvert = cache(rawValidatorGconvert, pcCache);

module.exports = { validatorGconvert, getForm, mapDBNames, bodyHandler };
