const process = require('process');
const _ = require('lodash');

let defaults = {
  PORT: 3000,
  MASTER_PASSWORD: '',
  PC_URL: 'http://www.pathwaycommons.org/',
  GPROFILER_URL: "http://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/",
  NCBI_EUTILS_BASE_URL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  PC_CACHE_MAX_SIZE: 1000,
  PUB_CACHE_MAX_SIZE: 1000000,
  MAX_SIF_NODES: 25,
  // DB config values
  DB_NAME:  'appui',
  DB_HOST:  '127.0.0.1',
  DB_PORT: '28015',
  DB_USER: undefined,
  DB_PASS: undefined,
  DB_CERT: undefined
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
