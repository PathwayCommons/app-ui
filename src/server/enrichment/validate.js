const request = require('request');
const Promise = require('promise-simple');
const _ = require('lodash');
const validateGp = function (query, userSetting) {
  const defaultSetting = {
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
  request.post({ url: "http://biit.cs.ut.ee/gprofiler/gconvert.cgi", formData: formData }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      d.reject(err);
    }

    d.resolve(body);
  });
  return d;
};


module.exports = validateGp;