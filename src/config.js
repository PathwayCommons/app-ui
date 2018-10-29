const _ = require('lodash');

let defaults = {
  PORT: 3000,
  MASTER_PASSWORD: '',
  PC_URL: 'http://www.pathwaycommons.org/',
  GPROFILER_URL: "https://biit.cs.ut.ee/gprofiler/",
  IDENTIFIERS_URL: 'http://identifiers.org',
  NCBI_EUTILS_BASE_URL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  HGNC_BASE_URL: 'https://rest.genenames.org',
  UNIPROT_API_BASE_URL: 'https://www.ebi.ac.uk/proteins/api',
  PC_CACHE_MAX_SIZE: 1000,
  PUB_CACHE_MAX_SIZE: 1000000,
  MAX_SIF_NODES: 25,
  // DB config values
  DB_NAME:  'appui',
  DB_HOST:  '127.0.0.1',
  DB_PORT: '28015',
  DB_USER: undefined,
  DB_PASS: undefined,
  DB_CERT: undefined,
  // factoid specific urls
  FACTOID_URL: 'http://unstable.factoid.baderlab.org/',
  BIOPAX_CONVERTERS_URL: 'http://biopax.baderlab.org/',
  DATASOURCE_HGNC: 'HGNC', // !!!temporary , will be updated as part of 'identifiers url generation module' https://github.com/PathwayCommons/app-ui/issues/1116
  DATASOURCE_HGNC_SYMBOL: 'HGNCSYMBOL',
  DATASOURCE_UNIPROT: 'UNIPROT',
  DATASOURCE_NCBI_GENE: 'NCBIGENE',
  DATASOURCE_ENSEMBL: 'ENSEMBL'
};

let envVars = _.pick( process.env, Object.keys( defaults ) );


// these vars are always included in the bundle because they ref `process.env.${name}` directly
// NB DO NOT include passwords etc. here
let clientVars = {
  NODE_ENV: process.env.NODE_ENV,
  PC_URL: process.env.PC_URL,
  FACTOID_URL: process.env.FACTOID_URL
};

_.assign(envVars, clientVars);

for( let key in envVars ){
  let val = envVars[key];

  if( val === '' || val == null ){
    delete envVars[key];
  }
}

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
