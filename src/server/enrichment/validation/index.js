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


// convertGConvertNames(officalSynonym) takes a gene identifier officalSynonym
// and converts it to gConvert names
const convertGConvertNames = (officalSynonym) => {
  if (officalSynonym === 'HGNCSYMBOL') { return 'HGNC'; }
  if (officalSynonym === 'HGNC') { return 'HGNC_ACC'; }
  if (officalSynonym === 'UNIPROT') { return 'UNIPROTSWISSPROT'; }
  if (officalSynonym === 'NCBIGENE') { return 'ENTREZGENE_ACC'; }
  return officalSynonym;
};


// validatorGconvert(query, userOptions) takes an identifier list query
// and an object of options userOptions
// and validates the query based on userOptions
const validatorGconvert = (query, userOptions) => {
  return promise = new Promise((resolve, reject) => {
    const formData = _.assign({}, defaultOptions, JSON.parse(JSON.stringify(userOptions)), { query: query });
    formData.organism = formData.organism.toLowerCase();
    const initialTarget = formData.target.toUpperCase();
    formData.target = convertGConvertNames(initialTarget);
    const invalidInfo = { invalidTarget: undefined, invalidOrganism: undefined };
    const queryVal = formData.query;
    if (!Array.isArray(queryVal)) {
      reject(new Error('ERROR: genes should be an array'));
    }
    formData.query = queryVal.join(" ");
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
        const previous = new Map();
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
            if (!previous.has(convertedAlias)) {
              previous.set(convertedAlias, initialAlias);
            } else {
              if (!(convertedAlias in duplicate)) {
                duplicate[convertedAlias] = new Set([previous.get(convertedAlias)]);
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


module.exports = { validatorGconvert, InvalidInfoError };
