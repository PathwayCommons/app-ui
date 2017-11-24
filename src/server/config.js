const process = require('process');
const _ = require('lodash');

let defaults = {
  PORT: 2000
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
