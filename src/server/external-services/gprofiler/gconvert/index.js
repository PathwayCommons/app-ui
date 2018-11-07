const { fetch } = require('../../../../util');
const _ = require('lodash');
const qs = require('query-string');
const QuickLRU = require('quick-lru');

const cleanUpEntrez = require('../clean-up-entrez');
const InvalidParamError = require('../../../../server/errors/invalid-param');
const { GPROFILER_URL, PC_CACHE_MAX_SIZE, DATASOURCE_HGNC, DATASOURCE_HGNC_SYMBOL, DATASOURCE_UNIPROT, DATASOURCE_NCBI_GENE, DATASOURCE_ENSEMBL } = require('../../../../config');
const cache = require('../../../cache');
const GCONVERT_URL = GPROFILER_URL + 'gconvert.cgi';

const DATASOURCE_NAMES = [DATASOURCE_HGNC, DATASOURCE_HGNC_SYMBOL, DATASOURCE_UNIPROT, DATASOURCE_NCBI_GENE, DATASOURCE_ENSEMBL];
const GPROFILER_DATASOURCE_NAMES = {
  HGNC: 'HGNC_ACC',
  HGNC_SYMBOL: 'HGNC',
  UNIPROT: 'UNIPROTSWISSPROT',
  NCBI_GENE: 'ENTREZGENE_ACC',
  ENSEMBL: 'ENSG'
};

const resultTemplate = ( unrecognized, duplicate, alias ) => {
  return {
    unrecognized: Array.from( unrecognized ) || [],
    duplicate: duplicate || {},
    alias: alias || {}
  };
};

const mapTarget = target  => {
  let mappedTarget;

  switch( target.toUpperCase() ){
    case DATASOURCE_HGNC:
      mappedTarget = GPROFILER_DATASOURCE_NAMES.HGNC;
      break;
    case DATASOURCE_HGNC_SYMBOL:
      mappedTarget = GPROFILER_DATASOURCE_NAMES.HGNC_SYMBOL;
      break;
    case DATASOURCE_UNIPROT:
      mappedTarget =  GPROFILER_DATASOURCE_NAMES.UNIPROT;
      break;
    case DATASOURCE_NCBI_GENE:
      mappedTarget =  GPROFILER_DATASOURCE_NAMES.NCBI_GENE;
      break;
    case DATASOURCE_ENSEMBL:
      mappedTarget =  GPROFILER_DATASOURCE_NAMES.ENSEMBL;
      break;
    default:
      mappedTarget = GPROFILER_DATASOURCE_NAMES.HGNC;
  }
  return mappedTarget;
};

const mapQuery = query => query.join(" ");

/*
 * mapParams
 * @param { object } params the input parameters
 */
const mapParams = params => {
  const target = mapTarget( params.target );
  const query = mapQuery( params.query );
  return _.assign({}, params, { target,  query });
};

/*
 * getForm
 * @param { array } query - Gene IDs
 * @param { object } userOptions
 * @returns { object } error and form
 */
const getForm = ( query, defaultOptions, userOptions ) => {

  let form = _.assign( {},
    defaultOptions,
    JSON.parse( JSON.stringify( userOptions ) ),
    { query: query }
  );

  if ( !Array.isArray( form.query ) ) {
    throw new InvalidParamError( 'Invalid query format' );
  }
  if ( !(_.values( DATASOURCE_NAMES )).includes( form.target.toUpperCase() ) ) {
    throw new InvalidParamError( 'Unrecognized targetDb' );
  }

  return mapParams( form );
};

const gConvertResponseHandler = body =>  {

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
  .then( response => response.text() )
  .then( gConvertResponseHandler );
};

const pcCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });

const validatorGconvert = cache(rawValidatorGconvert, pcCache);

module.exports = { validatorGconvert,
  getForm,
  mapParams,
  gConvertResponseHandler,
  GPROFILER_DATASOURCE_NAMES
};
