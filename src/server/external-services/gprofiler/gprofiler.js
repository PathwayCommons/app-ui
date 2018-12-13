const { fetch } = require('../../../util');
const _ = require('lodash');
const qs = require('query-string');
const QuickLRU = require('quick-lru');

const cleanUpEntrez = require('./clean-up-entrez');
const { GPROFILER_URL } = require('../../../config');
const logger = require('../../logger');
const { cachePromise } = require('../../cache');


const GPROFILER_DEFAULT_OPTS = {
  output: 'mini',
  organism: 'hsapiens',
  significant: 0,
  sort_by_structure: 1,
  ordered_query: 0,
  as_ranges: 0,
  no_iea: 1,
  underrep: 0,
  hierfiltering: 'none',
  user_thr: 0.05,
  min_set_size: 5,
  max_set_size: 200,
  threshold_algo: 'fdr',
  domain_size_type: 'annotated',
  custbg: [],
  'sf_GO:BP': 1,
  sf_REAC: 1,
  prefix: 'ENTREZGENE_ACC'
};

// parseGProfilerResponse(gProfilerResponse) takes the text response
// from gProfiler gProfilerResponse and parses it into JSON format
const parseGProfilerResponse = gProfilerResponse => {
  let lines = gProfilerResponse.split('\n').map( line => {
    if( line.substring(0, 1) === '#' ){ return ''; }
    return line;
  });

  let elements = _.compact(lines).map( line => line.split('\t') );

  let pathwayInfo = [];
  let P_VALUE_INDEX = 2;
  let PATHWAY_ID_INDEX = 8;
  let DESCRIPTION_INDEX = 11;
  let GENE_INTERSECTION_LIST_INDEX = 13;


  elements.forEach( ele => {
    let pathwayId = ele[PATHWAY_ID_INDEX];
    let pValue = ele[P_VALUE_INDEX];
    let description = ele[DESCRIPTION_INDEX].trim();
    let geneIntersectionList = ele[GENE_INTERSECTION_LIST_INDEX].split(',').map( gene => cleanUpEntrez( gene ) );

    pathwayInfo.push({
      id: pathwayId,
      data: {
        name: description,
        p_value: pValue,
        intersection: geneIntersectionList
      }
    });
  });

  return { pathwayInfo };
};


// enrichmemt(query, opts) takes a list of gene identifiers query
// and an object of user settings opts
// and extracts enrichment information
// from g:Profiler for the query list based on userSetting
const rawEnrichment = (query, opts) => {
  return new Promise((resolve, reject) => {
    let {
      minSetSize = GPROFILER_DEFAULT_OPTS.min_set_size,
      maxSetSize = GPROFILER_DEFAULT_OPTS.max_set_size,
      background = []
    } = opts;

    if (!Array.isArray(query)) {
      reject(new Error('ERROR: genes should be an array'));
    }
    if( typeof(minSetSize) != 'number' ) {
      reject(new Error('ERROR: minSetSize should be a number'));
    }
    if( minSetSize < 0 ){
      reject(new Error('ERROR: minSetSize should be >= 0'));
    }
    if( typeof(maxSetSize) != 'number' ){
      reject(new Error('ERROR: maxSetSize should be a number'));
    }
    if( maxSetSize < minSetSize ){
      reject(new Error('ERROR: maxSetSize should be >= minSetSize'));
    }
    if( !Array.isArray(background) ){
      reject(new Error('ERROR: backgroundGenes should be an array'));
    }

    let gProfilerOpts = _.assign( {}, GPROFILER_DEFAULT_OPTS, {
      query: query.sort().join(' '),
      min_set_size: minSetSize,
      max_set_size: maxSetSize,
      custbg: background.join(' ')
    } );


    fetch(GPROFILER_URL, { method: 'post', body: qs.stringify(gProfilerOpts)})
      .then( res => res.text() )
      .then( gprofilerRes =>  parseGProfilerResponse( gprofilerRes ) )
      .then( pathwayInfo => resolve( pathwayInfo ) )
      .catch( err =>{
        logger.error(`Error in validatorGconvert - ${err.message}`);
        throw err;
      });
  });
};

const lruCache = new QuickLRU({ maxSize: 100 });

const enrichment = cachePromise(rawEnrichment, lruCache);



module.exports = { enrichment, parseGProfilerResponse };