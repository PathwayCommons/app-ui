/*
Documentation for g:convert validator:
sample url: http://localhost:3000/api/validatorGconvert?genes=ATM ATP ATM
output: {"unrecognized":["ATP"],"duplicate":["ATM"],"geneInfo":[{"HGNC_symbol":"ATM","HGNC_id":"HGNC:795"}]}
*/

const fetch = require('node-fetch');
const _ = require('lodash');
const { validOrganism } = require('./validity-info');
const { validTarget } = require('./validity-info');
const qs = require('query-string');
const { cleanUpEntrez } = require('../helper');


const defaultOptions = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'HGNC',
  'prefix': 'ENTREZGENE_ACC'
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

const validatorGconvert = (query, userOptions = {}) => {
  return promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultOptions, JSON.parse(JSON.stringify(userOptions)), { query: query.join(" ") });
    formData.organism = formData.organism.toLowerCase();
    const initialTarget = formData.target.toUpperCase();
    formData.target = convertGConvertNames(initialTarget);
    const invalidInfo = { invalidTarget: undefined, invalidOrganism: undefined };
    if (!validOrganism.includes(formData.organism)) {
      invalidInfo.invalidOrganism = formData.organism;
    }
    if (!validTarget.includes(formData.target)) {
      invalidInfo.invalidTarget = formData.target;
    }
    if (invalidInfo.invalidOrganism != undefined || invalidInfo.invalidTarget != undefined) {
      reject(new InvalidInfoError(invalidInfo.invalidOrganism, invalidInfo.invalidTarget, ''));
    }

    fetch(gConvertURL, {
      method: 'post',
      body: qs.stringify(formData)
    }).then(gConvertResponse => gConvertResponse.text())
      .then(body => {
        const geneInfoList = _.map(body.split('\n'), ele => { return ele.split('\t'); });
        geneInfoList.splice(-1, 1); // remove last element ''

        const unrecognized = new Set();
        let duplicate = {};
        const previous = new Set();
        let geneInfo = new Set();
        const initialAliasIndex = 1;
        const convertedAliasIndex = 3;
        _.forEach(geneInfoList, info => {
          const convertedAlias = info[convertedAliasIndex];
          let initialAlias = info[initialAliasIndex];
          initialAlias = cleanUpEntrez(initialAlias);
          if (convertedAlias === 'N/A') {
            unrecognized.add(initialAlias);
          } else {
            if (previous.has(convertedAlias)) {
              previous.add(convertedAlias);
            } else {
              if (!(convertedAlias in duplicate)) {
                duplicate[convertedAlias] = new Set();
              }
              duplicate[convertedAlias].add(initialAlias);
            }
            geneInfo.add(JSON.stringify({initialAlias: initialAlias, convertedAlias: convertedAlias}));
          }
        });

        for (const initialAlias in duplicate) {
          duplicate[initialAlias] = Array.from(duplicate[initialAlias]);
        }
        geneInfo = _.map(Array.from(geneInfo), ele => { return JSON.parse(ele); });

        const ret = { unrecognized: Array.from(unrecognized), duplicate: duplicate, geneInfo: geneInfo };
        resolve(ret);
      })
  });
};


module.exports = { validatorGconvert };
