const { fetch } = require('../../../util');
const _ = require('lodash');
const QuickLRU = require('quick-lru');

const { GPROFILER_URL } = require('../../../config');
const logger = require('../../logger');
const { cachePromise } = require('../../cache');

const toJSON = res => res.json();

// See https://biit.cs.ut.ee/gprofiler/page/apis
const GPROFILER_GOST_URL = GPROFILER_URL + 'api/gost/profile/';
const GPROFILER_DEFAULT_OPTS = {
  organism: 'hsapiens',
	sources: ['GO:BP', 'REAC'],
	user_threshold: 0.05,
	all_results: false,
	ordered: false,
	combined: false,
	measure_underrepresentation: false,
	no_iea: true,
	domain_scope: 'annotated',
	numeric_ns: 'ENTREZGENE_ACC',
	significance_threshold_method: 'g_SCS',
  background: [],
  no_evidences: true
};

const DEFAULT_FILTER_OPTS = {
  minSetSize: 5,
  maxSetSize: 200
};

const parseGProfilerResponse = ( json, opts ) => {
  let pathways = [];
  const { 
    minSetSize = DEFAULT_FILTER_OPTS.minSetSize, 
    maxSetSize = DEFAULT_FILTER_OPTS.maxSetSize
  } = opts;
  const pathwayInfoList = _.get( json, ['result'] );  
  pathwayInfoList.forEach( pathwayInfo => {
    let { native: id, name, p_value, term_size } = pathwayInfo;
    if( term_size < minSetSize || term_size > maxSetSize ) return;
    pathways.push({
      id, 
      data: { name, p_value }
    });
  });

  return { pathways };
};


const validateParams = ( query, opts ) => {
  let error = null,
  message = '';
  const { minSetSize, maxSetSize } = opts;

  if( !Array.isArray( query ) ) message = 'ERROR: query must be an array'; 
  if( minSetSize && (typeof( minSetSize ) != 'number' || minSetSize < 0) ) message = 'ERROR: minSetSize must be a positive number';
  if( maxSetSize && (typeof( maxSetSize ) != 'number' || maxSetSize < 0) ) message = 'ERROR: maxSetSize must be a positive number';
  if( (minSetSize && maxSetSize) && (maxSetSize < minSetSize) ) message = 'ERROR: minSetSize must be less than maxSetSize';
  
  if ( !_.isEmpty( message ) ) error = new Error( message );
  return error;
};

const getGProfilerOpts = query => _.assign( {}, GPROFILER_DEFAULT_OPTS, { query } );

// enrichmemt(query, opts) takes a list of gene identifiers query
// and an object of user settings opts
// and extracts enrichment information
// from g:Profiler for the query list based on userSetting
const rawEnrichment = ( query, opts ) => {
  const gProfilerOpts = getGProfilerOpts( query, opts );

  return fetch( GPROFILER_GOST_URL, { 
    method: 'post',
    body: JSON.stringify( gProfilerOpts ),
    headers: { 'Content-Type': 'application/json' }
  })
  .then( toJSON )
  .then( gprofilerRes => parseGProfilerResponse( gprofilerRes, opts ) )
  .catch( err =>{
    logger.error(`Error in rawEnrichment - ${err.message}`);
    throw err;
  });  
};


const lruCache = new QuickLRU({ maxSize: 100 });

const enrichmentWrapper = cachePromise( rawEnrichment, lruCache );

const enrichment = async ( query, opts ) => {
  const paramError = validateParams( query, opts );
  if( paramError ) throw paramError;

  return enrichmentWrapper( query.sort(), opts );
};

module.exports = { enrichment, parseGProfilerResponse };