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
const gConvertURL = 'https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/gconvert.cgi';


const validatorGconvert = (query, userOptions) => {
  const promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultOptions, userOptions, { query: query });
    request.post({ url: gConvertURL, formData: formData }, (err, httpResponse, body) => {
      if (err) {
        reject(err);
      }
      const geneInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
      geneInfoList.splice(-1, 1); // remove last element ''

      const unrecogized = [];
      const duplicate = {};
      const geneInfo = [];
      const initialAliasIndex = 1;
      const convertedAliasIndex = 3;
      _.forEach(geneInfoList, info => {
        const curConvertedAlias = info[convertedAliasIndex];
        if (curConvertedAlias === 'N/A') {
          if (_.filter(unrecogized, ele => ele === info[initialAliasIndex]).length === 0) {
            unrecogized.push(info[initialAliasIndex]);
          }
        } else {
          if (_.filter(geneInfoList, ele => ele[convertedAliasIndex] === curConvertedAlias).length > 1) {
            if (!(curConvertedAlias in duplicate)) {
              duplicate[curConvertedAlias] = [];
            }
            if (_.filter(duplicate[curConvertedAlias], ele => ele === info[initialAliasIndex]).length === 0) {
              duplicate[curConvertedAlias].push(info[initialAliasIndex]);
            }
            if (_.filter(geneInfo, ele => ele.initialAlias === info[initialAliasIndex]).length === 0) {
              geneInfo.push({ initialAlias: info[initialAliasIndex], convertedAlias: info[convertedAliasIndex] });
            }
          }
        }
      });

      const ret = { options: { target: formData.target, organism: formData.organism }, unrecogized: unrecogized, duplicate: duplicate, geneInfo: geneInfo };
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