/*
Documentation for g:convert validator:
sample url: http://localhost:3000/api/validatorGconvert?genes=ATM ATP ATM
output: {"unrecogized":["ATP"],"duplicate":["ATM"],"geneInfo":[{"HGNC_symbol":"ATM","HGNC_id":"HGNC:795"}]}
*/

const request = require('request');
const _ = require('lodash');


const defaultOptions = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'HGNC'
};
const gConvertURL = 'http://biit.cs.ut.ee/gprofiler/gconvert.cgi';


const validatorGconvert = (query) => {
  const promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultOptions, { query: query });
    request.post({ url: gConvertURL, formData: formData }, (err, httpResponse, body) => {
      if (err) {
        reject(err);
      }
      const geneInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
      geneInfoList.splice(-1, 1); // remove last element ''

      const unrecogized = [];
      const duplicate = [];
      const geneInfo = [];
      const initialAliasIndex = 1;
      const convertedAliasIndex = 3;
      _.forEach(geneInfoList, info => {
        if (info[convertedAliasIndex] === 'N/A') {
          if (_.filter(unrecogized, ele => ele === info[initialAliasIndex]).length === 0) {
            unrecogized.push(info[initialAliasIndex]);
          }
        } else {
          if (_.filter(geneInfoList, ele => ele[convertedAliasIndex] === info[convertedAliasIndex]).length > 1 && _.filter(duplicate, ele => ele === info[initialAliasIndex]).length === 0) {
            duplicate.push(info[initialAliasIndex]);
          }
          if (_.filter(geneInfo, ele => ele.initialAlias === info[initialAliasIndex]).length === 0) {
            geneInfo.push({ initialAlias: info[initialAliasIndex], convertedAlias: info[convertedAliasIndex] });
          }
        }
      });

      const ret = { options: {target: defaultOptions.target, organism: defaultOptions.organism}, unrecogized: unrecogized, duplicate: duplicate, geneInfo: geneInfo };
      resolve(ret);
    });
  });
  return promise;
};


module.exports = { validatorGconvert };


// // simple testing
// validatorGconvert("ATM ATM AFF4 ATM ATP").then(function (results) {
//   console.log(results);
// });