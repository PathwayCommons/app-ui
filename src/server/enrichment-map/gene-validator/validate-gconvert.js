/*
Documentation for g:convert validator:
sample url: http://localhost:3000/api/validatorGconvert?genes=ATM ATP ATM
output: {"unrecogized":["ATP"],"duplicate":["ATM"],"geneInfo":[{"HGNC_symbol":"ATM","HGNC_id":"HGNC:795"}]}
*/

const request = require('request');
const _ = require('lodash');


const defaultSetting = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'ENSG'
};
const gConvertURL = 'http://biit.cs.ut.ee/gprofiler/gconvert.cgi';


const validatorGconvert = (query) => {
  const promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultSetting, { query: query });
    request.post({ url: gConvertURL, formData: formData }, (err, httpResponse, body) => {
      if (err) {
        reject(err);
      }
      const tmp = _.map(body.split('\n'), ele => { return ele.split('\t'); });
      tmp.splice(-1, 1); // remove last element ''
      console.log(tmp);

      const unrecogized = [];
      const duplicate = [];
      const geneInfo = [];
      const initialAliasIndex = 1;
      const nameIndex = 4;
      const descriptionIndex = 5;
      _.forEach(tmp, info => {
        if (info[nameIndex] === 'N/A') {
          if (_.filter(unrecogized, ele => ele === info[initialAliasIndex]).length === 0) {
            unrecogized.push(info[initialAliasIndex]);
          }
        } else {
          if (_.filter(tmp, ele => ele[initialAliasIndex] === info[initialAliasIndex]).length > 1 && _.filter(duplicate, ele => ele === info[initialAliasIndex]).length === 0) {
            duplicate.push(info[initialAliasIndex]);
          }
          if (_.filter(geneInfo, ele => ele.HGNC_symbol === info[initialAliasIndex]).length === 0) {
            geneInfo.push({ HGNC_symbol: info[initialAliasIndex], HGNC_id: info[descriptionIndex].substring(info[descriptionIndex].indexOf(';') + 5, info[descriptionIndex].length - 1) });
          }
        }
      });

      const ret = { unrecogized: unrecogized, duplicate: duplicate, geneInfo: geneInfo };
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