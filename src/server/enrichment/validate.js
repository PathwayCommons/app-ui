/*
documentation for enrichment
sample requset URL: http://localhost:3000/api/enrichment/?gene="KDM3A PAF1 PCGF5 BAZ1B NCOA1 UBE2B CCDC101 KDM5B MTA3 PCMT1 GTF3C4 MTA2 RBBP4 RNF20 SETD2 SSRP1 MBD1 POLR2B TP53BP1 UBR7 ARID4B ASH1L BRD4 HAT1 HDAC1 KAT2A MBD3 MSL3 RPA3 BAZ2A JMJD6 PHF7 SIN3B SP100 ZMYND11"
parameter:
gene - [string] a list of gene symbols delimited by whitespace
setting - [Object] optional user settings on "output", "organism", "significant", "sort_by_structure", "ordered_query", "as_ranges", "no_iea", "underrep", "hierfiltering", "user_thr", "min_set_size", "max_set_size", "threshold_algo", "domain_size_type", "custbg_cb", "custbg" overwritting default settings.
default settings:
    "output": "mini",
    "organism": "hsapiens",
    "significant": "1",
    "sort_by_structure": "1",
    "ordered_query": "0",
    "as_ranges": "0",
    "no_iea": "1",
    "underrep": "0",
    "hierfiltering": "none",
    "user_thr": "1",
    "min_set_size": "5",
    "max_set_size": "200",
    "threshold_algo": "fdr",
    "domain_size_type": "annotated",
    "custbg_cb": "none",
    "sf_REAC": "1",
    "sf_GO:BP": "1"
return:
[vector of String] a list of valid GO and REACTOME pathway IDs
*/
const removeEmptyLines = require('remove-blank-lines');
const request = require('request');
const Promise = require('promise-simple');
const _ = require('lodash');
const validateGp = function (query, userSetting) {
  var defaultSetting = {
    "output": "mini",
    "organism": "hsapiens",
    "significant": "1",
    "sort_by_structure": "1",
    "ordered_query": "0",
    "as_ranges": "0",
    "no_iea": "1",
    "underrep": "0",
    "hierfiltering": "none",
    "user_thr": "1",
    "min_set_size": "5",
    "max_set_size": "200",
    "threshold_algo": "fdr",
    "domain_size_type": "annotated",
    "custbg_cb": "none",
    "sf_GO:BP": "1",
    "sf_REAC": "1",
    "query": query
  };

  const formData = _.assign({}, defaultSetting, userSetting);
  const d = Promise.defer();
  let ret = [];
  request.post({ url: "http://biit.cs.ut.ee/gprofiler/", formData: formData }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      d.reject(err);
    }


    // extract lines starting with #WARNING
    const str3 = body.replace(/^(?!#WARNING.*$).*/mg, "");
    removeEmptyLines(str3);
    var arr = str3.split("\n");
    _.forEach(arr, ele => {
      if (ele !== '') {
        ret.push(ele);
      }
    });
    // needs to be added
    // gprofiler has wierd behavior
    // when there's no output, doesnt display warning messages
    // if (ret.length == 0) {
    //   ret = "Valid gene query";
    // }

    d.resolve(ret);
  });
  return d;
};


module.exports = validateGp;