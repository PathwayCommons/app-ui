const fetch = require('node-fetch')
const _ = require('lodash');
const qs = require('query-string');
const { cleanUpEntrez } = require('../helper');

const defaultSetting = {
  "output": "mini",
  "organism": "hsapiens",
  "significant": 0,
  "sort_by_structure": 1,
  "ordered_query": 0,
  "as_ranges": 0,
  "no_iea": 1,
  "underrep": 0,
  "hierfiltering": "none",
  "user_thr": 0.05,
  "min_set_size": 5,
  "max_set_size": 200,
  "threshold_algo": "fdr",
  "domain_size_type": "annotated",
  "custbg": [],
  "sf_GO:BP": 1,
  "sf_REAC": 1,
  "prefix": 'ENTREZGENE_ACC'
};

const gProfilerURL = "https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/";


// parseGProfilerResponse(gProfilerResponse) takes the text response
// from gProfiler gProfilerResponse and parses it into JSON format
const parseGProfilerResponse = (gProfilerResponse) => {
  let lines = _.map(gProfilerResponse.split('\n'), line => {
    if (line.substring(0, 1) === '#') {
      return '';
    }
    return line;
  });
  lines = _.compact(lines);
  return _.map(lines, line => {
    return line.split('\t');
  });
};


// enrichmemt(query, userSetting) takes a list of gene identifiers query
// and an object of user settings userSetting
// and extracts enrichment information
// from g:Profiler for the query list based on userSetting
const enrichment = (query, userSetting) => {
  // map camelCase to snake case (g:Profiler uses snake case parameters)
  userSetting = _.mapKeys(userSetting, (value, key) => {
    if (key === 'orderedQuery') return 'ordered_query';
    if (key === 'minSetSize') return 'min_set_size';
    if (key === 'maxSetSize') return 'max_set_size';
    return key;
  });

  return new Promise((resolve, reject) => {
    let formData = _.assign({}, defaultSetting, JSON.parse(JSON.stringify(userSetting)), { query: query });
    const queryVal = formData.query;
    const orderedQueryVal = formData.ordered_query;
    const minSetSizeVal = formData.min_set_size;
    const maxSetSizeVal = formData.max_set_size;
    const backgroundGenesVal = formData.custbg;
    if (!Array.isArray(queryVal)) {
      reject(new Error('ERROR: genes should be an array'));
    }
    formData.query = query.join(" ");
    if (orderedQueryVal != 0 && orderedQueryVal != 1) {
      reject(new Error('ERROR: orderedQuery should be 0 / false or 1 / true'));
    }
    if (typeof(formData.min_set_size) != 'number') {
      reject(new Error('ERROR: minSetSize should be a number'));
    }
    if (minSetSizeVal < 0) {
      reject(new Error('ERROR: minSetSize should be >= 0'));
    }
    if (typeof(formData.max_set_size) != 'number') {
      reject(new Error('ERROR: maxSetSize should be a number'));
    }
    if (maxSetSizeVal < minSetSizeVal) {
      reject(new Error('ERROR: maxSetSize should be >= minSetSize'));
    }
    if (!Array.isArray(backgroundGenesVal)) {
      reject(new Error('ERROR: backgroundGenes should be an array'));
    }
    formData.backgroundGenes = backgroundGenesVal.join(" ");

    fetch(gProfilerURL, {
      method: 'post',
      body: qs.stringify(formData)
    }).then(gProfilerResponse => gProfilerResponse.text())
      .then(body => {
        const responseInfo = parseGProfilerResponse(body);
        let ret = {};
        const pValueIndex = 2;
        const termIdIndex = 8;
        const tNameIndex = 11;
        const qAndTListIndex = 13;
        ret.pathwayInfo = {};
        _.forEach(responseInfo, elem => {
          ret.pathwayInfo[elem[termIdIndex]] = {
            "p-value": Number(elem[pValueIndex]),
            "description": elem[tNameIndex].trim(),
            "intersection": _.map(elem[qAndTListIndex].split(','), gene => {
              return cleanUpEntrez(gene);
            })
          };
        });
        resolve(ret);
      });
  });
};


module.exports = { enrichment };