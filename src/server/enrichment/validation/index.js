const fetch = require('node-fetch');
const _ = require('lodash');
const { validOrganism } = require('./validity-info');
const { validTargetDb } = require('./validity-info');
const qs = require('query-string');
const { cleanUpEntrez } = require('../helper');

const defaultOptions = {
  'output': 'mini',
  'organism': 'hsapiens',
  'target': 'HGNC',
  'prefix': 'ENTREZGENE_ACC'
};

class InvalidInfoError extends Error {
  constructor(invalidOrganism, invalidTargetDb, message) {
    super(message);
    this.invalidTargetDb = invalidTargetDb;
    this.invalidOrganism = invalidOrganism;
  }
}

const GCONVERT_URL = 'https://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/gconvert.cgi';
const FETCH_TIMEOUT = 5000; //ms
const noresult = query => {
  return {
    "unrecognized": query || [],
    "duplicate": {},
    "geneInfo": []
  };
};
const errorHandler = ( data ) => {
  if ( data.error instanceof Error ) {
    console.log( data.error.message );
    return new Promise( resolve => resolve( noresult(data.query) ) );
  } else {
    throw new Error(' something wrong ');
  }
};

// convertGConvertNames(officalSynonym) takes a gene identifier officalSynonym
// and converts it to gConvert names
const convertGConvertNames = (officalSynonym) => {
  if (officalSynonym === 'HGNCSYMBOL') { return 'HGNC'; }
  if (officalSynonym === 'HGNC') { return 'HGNC_ACC'; }
  if (officalSynonym === 'UNIPROT') { return 'UNIPROTSWISSPROT'; }
  if (officalSynonym === 'NCBIGENE') { return 'ENTREZGENE_ACC'; }
  return officalSynonym;
};


/*
 * getForm
 * @param { array } query
 * @param { object } defaultOptions
 * @param { object } userOptions
 * @returns { object } error array, form object
 */
const getForm = ( query, defaultOptions, userOptions ) => {

  const errors = [];
  const invalidInfo = { invalidTargetDb: undefined, invalidOrganism: undefined };

  const form = _.assign( {}, defaultOptions, JSON.parse( JSON.stringify( userOptions ) ), { query: query } );
  form.organism.toLowerCase();
  form.target = convertGConvertNames( form.target.toUpperCase() );

  if (!Array.isArray( form.query )) {
    errors.push( new Error('ERROR: genes should be an array') );
  }
  form.query = form.query.join(" ");
  if ( !validOrganism.includes( form.organism ) ) {
    invalidInfo.invalidOrganism = form.organism;
  }
  if ( !validTargetDb.includes( form.target ) ) {
    invalidInfo.invalidTargetDb = form.target;
  }
  if ( invalidInfo.invalidOrganism != undefined || invalidInfo.invalidTargetDb != undefined ) {
    errors.push( new InvalidInfoError(invalidInfo.invalidOrganism, invalidInfo.invalidTargetDb, '') );
  }

  return {
    form: form,
    errors : errors
  };
};


// validatorGconvert(query, userOptions) takes an identifier list query
// and an object of options userOptions
// and validates the query based on userOptions
const validatorGconvert = ( query, userOptions ) => {

  return new Promise( ( resolve, reject ) => {

    const formData = getForm( query, defaultOptions, userOptions );
    console.log(formData);

    fetch(GCONVERT_URL,
      {
        method: 'post',
        body: qs.stringify( formData.form ),
        timeout: FETCH_TIMEOUT
      }
    )
    .then(gConvertResponse => gConvertResponse.text())
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
    .catch( error => {
      console.log( `Fetch Error: ${error}` );
      reject( { error: error, query: query} ); //pass up to the parent Promise
    });
  })
  .catch( errorHandler );
};


module.exports = { validatorGconvert, InvalidInfoError };
