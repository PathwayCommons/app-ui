/*
Documentation for g:convert validator:
sample url: http://localhost:3000/api/validatorGconvert?genes=ATM ATP ATM
output: {"unrecognized":["ATP"],"duplicate":["ATM"],"geneInfo":[{"HGNC_symbol":"ATM","HGNC_id":"HGNC:795"}]}
*/

const request = require('request');
const _ = require('lodash');
const { validOrganism } = require('./validityInfo');
const { validTarget } = require('./validityInfo');


const defaultOptions = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'HGNC'
};

class InvalidInfoError extends Error {
  constructor(invalidOrganism, invalidTarget, message) {
    super(message);
    this.invalidTarget = invalidTarget;
    this.invalidOrganism = invalidOrganism;
  }
}

const gConvertURL = 'https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/gconvert.cgi';


// convert offical synonyms to gConvert names
const convertGConvertNames = (gConvertName) => {
  if (gConvertName === 'HGNCSYMBOL') { return 'HGNC'; }
  if (gConvertName === 'HGNC') { return 'HGNC_ACC'; }
  if (gConvertName === 'UNIPROT') { return 'UNIPROTSWISSPROT'; }
  if (gConvertName === 'NCBIGENE') { return 'ENTREZGENE_ACC'; }
  return gConvertName;
};

const validatorGconvert = (query, userOptions) => {
  const promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultOptions, userOptions, { query: query });
    formData.organism = formData.organism.toLowerCase();
    const initialTarget = formData.target.toUpperCase();
    formData.target = convertGConvertNames(initialTarget);
    const invalidInfo = { invalidTarget: '', invalidOrganism: '' };
    if (!validOrganism.includes(formData.organism)) {
      invalidInfo.invalidOrganism = formData.organism;
    }
    if (!validTarget.includes(formData.target)) {
      invalidInfo.invalidTarget = formData.target;
    }
    if (invalidInfo.invalidOrganism != '' || invalidInfo.invalidTarget != '') {
      reject(new InvalidInfoError(invalidInfo.invalidOrganism, invalidInfo.invalidTarget, ''));
    }

    if (formData.target === 'ENTREZGENE_ACC') {
      formData.query = _.map(formData.query.split(/\s+/), ele => {
        if (Number.isInteger(Number(ele))) {
          return 'ENTREZGENE_ACC:' + ele;
        }
        return ele;
      }
      ).join(' ');
    }

    request.post({ url: gConvertURL, formData: formData }, (err, httpResponse, body) => {
      if (err) {
        reject(err);
      }
      const geneInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
      geneInfoList.splice(-1, 1); // remove last element ''

      const unrecognized = [];
      const duplicate = [];
      const geneInfo = [];
      const initialAliasIndex = 1;
      const convertedAliasIndex = 3;
      _.forEach(geneInfoList, info => {
        const initialAlias = info[initialAliasIndex];
        const colonIndex = 14;
        if (formData.target === 'ENTREZGENE_ACC' && initialAlias.substring(0, colonIndex + 1) === 'ENTREZGENE_ACC:') {
          info[initialAliasIndex] = initialAlias.split(':')[1];
        }

        if (info[convertedAliasIndex] === 'N/A') {
          if (_.filter(unrecognized, ele => ele === info[initialAliasIndex]).length === 0) {
            unrecognized.push(info[initialAliasIndex]);
          }
        } else {
          if (formData.target === 'ENTREZGENE_ACC') {
            info[convertedAliasIndex] = info[convertedAliasIndex].split(':')[1];
          }
          if (_.filter(geneInfoList, ele => ele[convertedAliasIndex] === info[convertedAliasIndex]).length > 1 && _.filter(duplicate, ele => ele === info[initialAliasIndex]).length === 0) {
            duplicate.push(info[initialAliasIndex]);
          }
          if (_.filter(geneInfo, ele => ele.initialAlias === info[initialAliasIndex]).length === 0) {
            geneInfo.push({ initialAlias: info[initialAliasIndex], convertedAlias: info[convertedAliasIndex] });
          }
        }
      });

      const ret = { options: { target: initialTarget, organism: formData.organism }, unrecognized: unrecognized, duplicate: duplicate, geneInfo: geneInfo };
      resolve(ret);
    });
  });
  return promise;
};


module.exports = { validatorGconvert };
