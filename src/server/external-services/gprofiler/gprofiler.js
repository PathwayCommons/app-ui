const { fetch } = require('../../../util');
const _ = require('lodash');
const qs = require('query-string');

const cleanUpEntrez = require('./clean-up-entrez');
const { GPROFILER_URL } = require('../../../config');

const GPROFILER_DEFAULT_OPTS = {
  'output': 'mini',
  'organism': 'hsapiens',
  'significant': 0,
  'sort_by_structure': 1,
  'ordered_query': 0,
  'as_ranges': 0,
  'no_iea': 1,
  'underrep': 0,
  'hierfiltering': 'none',
  'user_thr': 0.05,
  'min_set_size': 5,
  'max_set_size': 200,
  'threshold_algo': 'fdr',
  'domain_size_type': 'annotated',
  'custbg': [],
  'sf_GO:BP': 1,
  'sf_REAC': 1,
  'prefix': 'ENTREZGENE_ACC'
};

// parseGProfilerResponse(gProfilerResponse) takes the text response
// from gProfiler gProfilerResponse and parses it into JSON format
const parseGProfilerResponse = gProfilerResponse => {
  let lines = gProfilerResponse.split('\n').map( line => {
    if( line.substring(0, 1) === '#' ){ return ''; }
    return line;
  });

  let elements = _.compact(lines).map( line => line.split('\t') );

  let pathwayInfo = {};
  let P_VALUE_INDEX = 2;
  let PATHWAY_ID_INDEX = 8;
  let DESCRIPTION_INDEX = 11;
  let GENE_INTERSECTION_LIST_INDEX = 13;


  elements.forEach( ele => {
    let pathwayId = ele[PATHWAY_ID_INDEX];
    let pValue = ele[P_VALUE_INDEX];
    let description = ele[DESCRIPTION_INDEX];
    let geneIntersectionList = ele[GENE_INTERSECTION_LIST_INDEX].split(',').map( gene => cleanUpEntrez( gene ) );

    pathwayInfo[pathwayId] = {
      p_value: pValue,
      description,
      intersection: geneIntersectionList
    };
  });

  return { pathwayInfo };
};


// enrichmemt(query, userSetting) takes a list of gene identifiers query
// and an object of user settings userSetting
// and extracts enrichment information
// from g:Profiler for the query list based on userSetting
const enrichment = (query, userSetting) => {
  // map camelCase to snake case (g:Profiler uses snake case parameters)
  userSetting = _.mapKeys(userSetting, (value, key) => {
    if (key === 'minSetSize') return 'min_set_size';
    if (key === 'maxSetSize') return 'max_set_size';
    if (key === 'background') return 'custbg';
    return key;
  });

  return new Promise((resolve, reject) => {
    let formData = _.assign({}, GPROFILER_DEFAULT_OPTS, JSON.parse(JSON.stringify(userSetting)), { query: query });
    let {
      query: queryVal,
      min_set_size: minSetSize,
      max_set_size: maxSetSize,
      custbg: backgroundGenes
    } = formData;

    if (!Array.isArray(queryVal)) {
      reject(new Error('ERROR: genes should be an array'));
    }
    formData.query = query.join(' ');
    if (typeof(formData.min_set_size) != 'number') {
      reject(new Error('ERROR: minSetSize should be a number'));
    }
    if (minSetSize < 0) {
      reject(new Error('ERROR: minSetSize should be >= 0'));
    }
    if (typeof(formData.max_set_size) != 'number') {
      reject(new Error('ERROR: maxSetSize should be a number'));
    }
    if (maxSetSize < minSetSize) {
      reject(new Error('ERROR: maxSetSize should be >= minSetSize'));
    }
    if (!Array.isArray(backgroundGenes)) {
      reject(new Error('ERROR: backgroundGenes should be an array'));
    }
    formData.custbg = backgroundGenes.join(' ');

    fetch(GPROFILER_URL, { method: 'post', body: qs.stringify(formData)})
      .then( res => res.text() )
      .then( gprofilerRes =>  parseGProfilerResponse( gprofilerRes ) )
      .then( pathwayInfo => resolve( pathwayInfo ) );
  });
};


module.exports = { enrichment, parseGProfilerResponse };