/*
documentation for enrichment
sample request URL: http://localhost:3000/api/enrichment/?genes=HCFC1 ATM
parameter:
genes - [string] a list of gene symbols delimited by whitespace
return:
[vector of Object] relevant info for valid genes
*/
const request = require('request');
const _ = require('lodash');


// remove #WARNING, #INFO, and the first line
const parseGProfilerResponse = (gProfilerResponse) => {
  // remove the second line
  const lines = gProfilerResponse.split('\n');
  lines.slice(0, 1);
  const str1 = gProfilerResponse.split('\n').slice(0, 1).join("\n");
  let str2 = gProfilerResponse.split('\n').slice(2).join("\n"); // concatenate at last
  // remove lines starting with #
  const str3 = str2.replace(/^#.*$/mg, "");
  const str4 = (str1 + '\n').concat(str3);
  return str4;
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
  const promise = new Promise((resolve, reject) => {
    let formData = _.assign(defaultSetting, { "query": query }, userSetting);
    const orderedQueryVal = Number(formData.ordered_query);
    const userThrVal = Number(formData.user_thr);
    const minSetSizeVal = Number(formData.min_set_size);
    const maxSetSizeVal = Number(formData.max_set_size);
    const thresholdAlgoVal = formData.threshold_algo;
    const custbgVal = formData.custbg.split(/\s+/);
    formData = _.assign(formData, {
      "ordered_query": orderedQueryVal,
      "user_thr": userThrVal,
      "min_set_size": minSetSizeVal,
      "max_set_size": maxSetSizeVal,
      "custbg": custbgVal
    })
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

    request.post({ url: gProfilerURL, formData: formData }, (err, httpResponse, gProfilerResponse) => {
      if (err) {
        reject(err);
      }

      let responseInfo = parseGProfilerResponse(gProfilerResponse).split('\n');
      responseInfo.splice(0, 1); // remove first elem
      responseInfo = _.map(responseInfo, ele => ele.split('\t'));
      responseInfo = _.filter(responseInfo, ele => ele.length != 1);

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
  });
  return promise;
};


module.exports = { enrichment };

