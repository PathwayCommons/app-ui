const process = require('process');
const _ = require('lodash');

let defaults = {
  PORT: 3000,
  PC_URI: "https://www.pathwaycommons.org/pc2/",
  BASE_URL: "https://www.pathwaycommons.org"
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
