/*
documentation for enrichment
sample request URL: http://localhost:3000/api/enrichment/?genes=HCFC1 ATM
parameter:
genes - [string] a list of gene symbols delimited by whitespace
return:
[vector of Object] relevant info for valid genes
*/
const fetch = require('node-fetch')
const _ = require('lodash');
const qs = require('query-string');


const parseGProfilerResponse = (gProfilerResponse) => {
  let lines = _.map(gProfilerResponse.split('\n'), line => {
    if (line.substring(0, 1) === '#') {
      return '';
    }
    return line;
  });
  lines = _.filter(lines, line => line != '');
  return _.map(lines, line => {
    return line.split('\t');
  })
};


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


const enrichment = (query, userSetting) => {
  return promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultSetting, { "query": query }, userSetting);
    const orderedQueryVal = Number(formData.ordered_query);
    const userThrVal = Number(formData.user_thr);
    const minSetSizeVal = Number(formData.min_set_size);
    const maxSetSizeVal = Number(formData.max_set_size);
    const thresholdAlgoVal = formData.threshold_algo;
    if (orderedQueryVal != 0 && orderedQueryVal != 1) {
      reject(new Error('ERROR: orderedQuery should be 1 or 0'));
    }
    if (isNaN(userThrVal) || userThrVal > 1 || userThrVal < 0) {
      reject(new Error('ERROR: userThrVal should be a number [0, 1]'));
    }
    if (isNaN(minSetSizeVal)) {
      reject(new Error('ERROR: minSetSize should be a number'));
    }
    if (minSetSizeVal < 0) {
      reject(new Error('ERROR: minSetSize should be >= 0'));
    }
    if (isNaN(maxSetSizeVal)) {
      reject(new Error('ERROR: maxSetSize should be a number'));
    }
    if (maxSetSizeVal < minSetSizeVal) {
      reject(new Error('ERROR: maxSetSize should be >= minSetSize'));
    }
    if (thresholdAlgoVal != 'analytical' && thresholdAlgoVal != 'bonferroni' && thresholdAlgoVal != 'fdr') {
      reject(new Error('ERROR: thresholdAlgoVal should be one of analytical, bonferroni, fdr'));
    }

    fetch(gProfilerURL, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify(formData)
    }).then(gProfilerResponse => gProfilerResponse.text())
      .then(body => {
        let responseInfo = parseGProfilerResponse(body);
        const ret = {};
        const pValueIndex = 2;
        const tIndex = 3;
        const qIndex = 4;
        const qAndTIndex = 5;
        const qAndTOverQIndex = 6;
        const qAndTOverTIndex = 7;
        const termIdIndex = 8;
        const tTypeIndex = 9;
        const tGroupIndex = 10;
        const tNameIndex = 11;
        const tDepthIndex = 12;
        const qAndTListIndex = 13;
        ret.options = {};
        ret.options.orderedQuery = formData.ordered_query;
        ret.options.userThr = formData.user_thr;
        ret.options.minSetSize = formData.min_set_size;
        ret.options.maxSetSize = formData.max_set_size;
        ret.options.thresholdAlgo = formData.threshold_algo;
        ret.options.custbg = formData.custbg;
        ret.pathwayInfo = {};
        _.forEach(responseInfo, elem => {
          ret.pathwayInfo[elem[termIdIndex]] = {
            pValue: Number(elem[pValueIndex]),
            t: Number(elem[tIndex]),
            q: Number(elem[qIndex]),
            qAndT: Number(elem[qAndTIndex]),
            qAndTOverQ: Number(elem[qAndTOverQIndex]),
            qAndTOverT: Number(elem[qAndTOverTIndex]),
            tType: elem[tTypeIndex].trim(),
            tGroup: Number(elem[tGroupIndex]),
            tName: elem[tNameIndex].trim(),
            tDepth: Number(elem[tDepthIndex]),
            qAndTList: _.map(elem[qAndTListIndex].split(','), gene => {
              const colonIndex = 14;
              if (gene.substring(0, colonIndex + 1) === 'ENTREZGENE_ACC:') {
                const ncbiNameIndex = 1;
                return gene.split(':')[ncbiNameIndex];
              }
              return gene;
            })
          };
        });
        resolve(ret);
      });
  })
}


module.exports = { enrichment };

