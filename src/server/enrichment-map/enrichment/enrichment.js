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
  const str1 = gProfilerResponse.split('\n').slice(0, 1).join("\n");
  let str2 = gProfilerResponse.split('\n').slice(2).join("\n"); // concatenate at last
  // remove lines starting with #
  const str3 = str2.replace(/^#.*$/mg, "");
  const str4 = (str1 + '\n').concat(str3);
  return str4;
};

// extract #WARNING from response
const extractWarning = (gProfilerResponse) => {
  const warningLines = gProfilerResponse.replace(/^(?!#WARNING).*$/mg, "");
  const warningInfo = _.filter(warningLines.split('\n'), ele => ele.length != 0);
  return warningInfo;
};

const defaultSetting = {
  "output": "mini",
  "organism": "hsapiens",
  "significant": 1,
  "sort_by_structure": 1,
  "ordered_query": 0,
  "as_ranges": 0,
  "no_iea": 1,
  "underrep": 0,
  "hierfiltering": "none",
  "user_thr": 1,
  "min_set_size": 5,
  "max_set_size": 200,
  "threshold_algo": "fdr",
  "domain_size_type": "annotated",
  "custbg": [],
  "custbg_cb": 0,
  "sf_GO:BP": 1,
  "sf_REAC": 1,
};
const gProfilerURL = "https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/";


const enrichment = (query, userSetting) => {
  const promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultSetting, { "query": query }, userSetting);
    request.post({ url: gProfilerURL, formData: formData }, (err, httpResponse, gProfilerResponse) => {
      if (err) {
        reject(err);
      }

      const unrecognized = [];
      const duplicate = [];
      const warningInfo = extractWarning(gProfilerResponse);
      _.forEach(warningInfo, ele => {
        const desIndex = 1;
        const hgncSymbolIndex = 1;
        if (ele.indexOf('same internal ID') > -1) {
          duplicate.push(ele.split('\t')[desIndex].split(/\s+/)[hgncSymbolIndex]);
        } else if (ele.indexOf('not recognized') > -1) {
          unrecognized.push(ele.split('\t')[desIndex].split(/\s+/)[hgncSymbolIndex]);
        }
      });

      let responseInfo = parseGProfilerResponse(gProfilerResponse).split('\n');
      responseInfo.splice(0, 1); // remove first elem
      responseInfo = _.map(responseInfo, ele => ele.split('\t'));
      responseInfo = _.filter(responseInfo, ele => ele.length != 1);

      const ret = {};
      const signfIndex = 1;
      const pvalueIndex = 2;
      const TIndex = 3;
      const QIndex = 4;
      const QTIndex = 5;
      const QTQIndex = 6;
      const QTTIndex = 7;
      const termIdIndex = 8;
      const tTypeIndex = 9;
      const tGroupIndex = 10;
      const tNameIndex = 11;
      const tDepthIndex = 12;
      const QTListIndex = 13;
      ret.duplicate = duplicate;
      ret.unrecognized = unrecognized;
      ret.orderedQuery = formData.ordered_query;
      ret.userThr = formData.user_thr;
      ret.minSetSize = formData.min_set_size;
      ret.maxSetSize = formData.max_set_size;
      ret.thresholdAlgo = formData.threshold_algo;
      ret.custbg = formData.custbg;
      ret.custbgCb = formData.custbg_cb;
      ret.pathwayInfo = {};
      _.forEach(responseInfo, elem => {
        let termIdInfo = { signf: elem[signfIndex], pvalue: elem[pvalueIndex], T: elem[TIndex], Q: elem[QIndex], tType: elem[tTypeIndex], tGroup: elem[tGroupIndex], tName: elem[tNameIndex], tDepth: elem[tDepthIndex] };
        termIdInfo["Q&T"] = elem[QTIndex];
        termIdInfo["Q&T/Q"] = elem[QTQIndex];
        termIdInfo["Q&T/T"] = elem[QTTIndex];
        termIdInfo["Q&TList"] = elem[QTListIndex];
        ret.pathwayInfo[elem[termIdIndex]] = termIdInfo;
      });
      resolve(ret);
    });
  });
  return promise;
};


module.exports = { enrichment };

