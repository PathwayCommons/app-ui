const process = require('process');
const _ = require('lodash');

let defaults = {
  databaseName:  'metadataTestMk2',
  ip:  '192.168.81.233',
  tables:  ['version', 'graph', 'layout'],
  port: '28015'
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;