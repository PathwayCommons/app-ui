const _ = require('lodash');
const qs = require('query-string');
const QuickLRU = require('quick-lru');
const logger = require('../../../logger');

const { fetch } = require('../../../../util');
const cleanUpEntrez = require('../clean-up-entrez');
const InvalidParamError = require('../../../../server/errors/invalid-param');
const { GPROFILER_URL, PC_CACHE_MAX_SIZE, NS_HGNC, NS_HGNC_SYMBOL, NS_UNIPROT, NS_NCBI_GENE, NS_ENSEMBL } = require('../../../../config');
const cache = require('../../../cache');
const GCONVERT_URL = GPROFILER_URL + 'gconvert.cgi';

const GPROFILER_NS_MAP = new Map([
  [NS_HGNC, 'HGNC_ACC'],
  [NS_HGNC_SYMBOL, 'HGNC'],
  [NS_UNIPROT, 'UNIPROTSWISSPROT'],
  [NS_NCBI_GENE, 'ENTREZGENE_ACC'],
  [NS_ENSEMBL, 'ENSG']
]);

const resultTemplate = ( unrecognized, duplicate, alias ) => {
  return {
    unrecognized: Array.from( unrecognized ) || [],
    duplicate: duplicate || {},
    alias: alias || {}
  };
};

const mapTarget = target  => {
  const gconvertNamespace = GPROFILER_NS_MAP.get( target );
  if( !gconvertNamespace ) throw new InvalidParamError( 'Unrecognized targetDb' );
  return gconvertNamespace;
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
    'target': NS_HGNC,
    'prefix': 'ENTREZGENE_ACC'
  };

  return Promise.resolve()
    .then( () => getForm( query, defaultOptions, userOptions ) )
    .then( form => fetch( GCONVERT_URL, {
      method: 'post',
      body: qs.stringify( form )
    }))
    .then( response => response.text() )
    .then( gConvertResponseHandler )
    .catch( err => {
      logger.error(`Error in validatorGconvert - ${err.message}`);
      throw err;
    });
};

const pcCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });

const validatorGconvert = cache(rawValidatorGconvert, pcCache);

module.exports = { validatorGconvert,
  getForm,
  mapParams,
  gConvertResponseHandler,
  GPROFILER_NS_MAP
};
