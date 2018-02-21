//const removeEmptyLines = require('remove-blank-lines');
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
  //let ret = [];
  request.post({ url: "http://biit.cs.ut.ee/gprofiler/gconvert.cgi", formData: formData }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      d.reject(err);
    }


    // extract lines starting with #WARNING
    // const str3 = body.replace(/^(?!#WARNING.*$).*/mg, "");
    // removeEmptyLines(str3);
    // var arr = str3.split("\n");
    // _.forEach(arr, ele => {
    //   if (ele !== '') {
    //     ret.push(ele);
    //   }
    // });
    // needs to be added
    // gprofiler has wierd behavior
    // when there's no output, doesnt display warning messages
    // if (ret.length == 0) {
    //   ret = "Valid gene query";
    // }

    d.resolve(body);
  });
  return d;
};


module.exports = validateGp;