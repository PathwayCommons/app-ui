const request = require('request');
const csv = require('csvtojson');
const fs = require('fs');
const _ = require('lodash');
const enrichment = function (query) {

  var promise = new Promise(function (resolve, reject) {
    // do a thing, possibly async, then…

    var formData = {
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
      "query": query
    };
    request.post({ url: "http://biit.cs.ut.ee/gprofiler/", formData: formData }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        reject(err);
      }

      // remove the second line
      const lines = body.split('\n');
      lines.slice(0, 1);
      const str1 = body.split('\n').slice(0, 1).join("\n");
      let str2 = body.split('\n').slice(2).join("\n"); // concatenate at last

      // remove lines starting with #
      const str3 = str2.replace(/^#.*$/mg, "");
      const str4 = (str1 + '\n').concat(str3);
      fs.writeFileSync("outputFile", str4);

      // convert csv to json, extract "term id"
      let collection = [];
      let ret = [];
      csv({ delimiter: "\t" })
        .fromFile("outputFile")
        .on('json', (jsonObj) => {
          collection.push(jsonObj);
        })
        .on('done', (error) => {
          _.forEach(collection, function (elem) {
            ret.push(elem["term ID"]);
          });
          resolve(ret);
        });
    });

  });

  return promise;

  // var formData = {
  //   "output": "mini",
  //   "organism": "hsapiens",
  //   "significant": "1",
  //   "sort_by_structure": "1",
  //   "ordered_query": "0",
  //   "as_ranges": "0",
  //   "no_iea": "1",
  //   "underrep": "0",
  //   "hierfiltering": "none",
  //   "user_thr": "1",
  //   "min_set_size": "5",
  //   "max_set_size": "200",
  //   "threshold_algo": "fdr",
  //   "domain_size_type": "annotated",
  //   "custbg_cb": "none",
  //   "sf_GO:BP": "1",
  //   "query": query
  // };
  // const d = Promise.defer();
  // request.post({ url: "http://biit.cs.ut.ee/gprofiler/", formData: formData }, function optionalCallback(err, httpResponse, body) {
  //   if (err) {
  //     d.reject(err);
  //   }

  //   // remove the second line
  //   const lines = body.split('\n');
  //   lines.slice(0, 1);
  //   const str1 = body.split('\n').slice(0, 1).join("\n");
  //   let str2 = body.split('\n').slice(2).join("\n"); // concatenate at last

  //   // remove lines starting with #
  //   const str3 = str2.replace(/^#.*$/mg, "");
  //   const str4 = (str1 + '\n').concat(str3);
  //   fs.writeFileSync("outputFile", str4);

  //   // convert csv to json, extract "term id"
  //   let collection = [];
  //   let ret = [];
  //   csv({ delimiter: "\t" })
  //     .fromFile("outputFile")
  //     .on('json', (jsonObj) => {
  //       collection.push(jsonObj);
  //     })
  //     .on('done', (error) => {
  //       _.forEach(collection, function (elem) {
  //         ret.push(elem["term ID"]);
  //       });
  //       d.resolve(ret);
  //     });
  // });
  // return d;
};

// console.log(enrichment('TP53'));

// enrichment('TP53').then(function(res){console.log(res)});

module.exports = enrichment;