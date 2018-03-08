/*
documentation for enrichment
sample request URL: http://localhost:3000/api/enrichment/?genes=HCFC1 ATM
parameter:
genes - [string] a list of gene symbols delimited by whitespace
return:
[vector of Object] relevant info for valid genes
*/
const request = require('request');
const csv = require('csvtojson');
const fs = require('fs');
const _ = require('lodash');
const path = require("path");


const enrichment = (query, userSetting) => {
  const promise = new Promise( (resolve, reject) => {
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
    request.post({ url: "https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/", formData: formData }, (err, httpResponse, body) => {
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
      fs.writeFileSync("src/server/enrichment/outputFile", str4);
      // convert csv to json, extract "term id"
      let collection = [];
      let ret = {};
      csv({ delimiter: "\t" })
        .fromFile("src/server/enrichment/outputFile")
        .on('json', (jsonObj) => {
          collection.push(jsonObj);
        })
        .on('done', (error) => {
          _.forEach(collection, (elem) => {
            ret[elem["term ID"]] = {signf: elem["signf"], pvalue: elem["p-value"], T: elem["T"]};
            ret[elem["term ID"]]["Q&T"] = elem["Q&T"];
            ret[elem["term ID"]]["Q&T/Q"] = elem["Q&T/Q"];
            ret[elem["term ID"]]["Q&T/T"] = elem["Q&T/T"];
            ret[elem["term ID"]]["t type"] = elem["t type"];
            ret[elem["term ID"]]["t group"] = elem["t group"];
            ret[elem["term ID"]]["t name"] = elem["t name"];
            ret[elem["term ID"]]["t depth"] = elem["t depth"];
            ret[elem["term ID"]]["Q&T list"] = elem["Q&T list"];
          });
          fs.unlinkSync(path.resolve(__dirname, "outputFile"));
          resolve(ret);
        });
    });
  });
  return promise;
};


module.exports = {enrichment};