const process = require('process');
const _ = require('lodash');

let defaults = {
  PORT: 3000,
  MASTER_PASSWORD: '',
  PC_URL: 'http://www.pathwaycommons.org/',
  GPROFILER_URL: "http://biit.cs.ut.ee/gprofiler_archive3/r1741_e90_eg37/web/",
  PC_CACHE_MAX_SIZE: 1000
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
