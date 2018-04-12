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
  lines = _.compact(lines);
  return _.map(lines, line => {
    return line.split('\t');
  })
};

// extract #WARNING from response
const extractWarning = (gProfilerResponse) => {
  const warningLines = gProfilerResponse.replace(/^(?!#WARNING).*$/mg, "");
  const warningInfo = _.filter(warningLines.split('\n'), ele => ele.length != 0);
  const duplicate = [];
  const unrecognized = [];
  _.forEach(warningInfo, ele => {
    const desIndex = 1;
    const hgncSymbolIndex = 1;
    if (ele.indexOf('same internal ID') > -1) {
      const duplicateGene = ele.split('\t')[desIndex].split(/\s+/)[hgncSymbolIndex];
      if (_.filter(duplicate, ele => ele === duplicateGene).length === 0) {
        duplicate.push(duplicateGene);
      }
    } else if (ele.indexOf('not recognized') > -1) {
      const unrecognizedGene = ele.split('\t')[desIndex].split(/\s+/)[hgncSymbolIndex];
      if (_.filter(unrecognized, ele => ele === unrecognizedGene).length === 0)
        unrecognized.push(unrecognizedGene);
    }
  })
  return { duplicate: duplicate, unrecognized: unrecognized };
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



const enrichment = (query, userSetting = {}) => {
  userSetting = _.mapKeys(userSetting, (value, key) => {
    if (key === 'orderedQuery') return 'ordered_query';
    if (key === 'userThr') return 'user_thr';
    if (key === 'minSetSize') return 'min_set_size';
    if (key === 'maxSetSize') return 'max_set_size';
    if (key === 'thresholdAlgo') return 'threshold_algo';
    return key;
  })

  return promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultSetting, JSON.parse(JSON.stringify(userSetting)), { query: query });
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
        const warning = extractWarning(body);
        const responseInfo = parseGProfilerResponse(body);
        let ret = {};
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
        ret = _.assign(warning, ret);
        resolve(ret);
      });
  })
}


module.exports = { enrichment };