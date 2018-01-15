const process = require('process');
const _ = require('lodash');

let defaults = {
  databaseName:  'metadataTestMk2',
  host:  '127.0.0.1',
  tables:  ['version', 'graph', 'layout', 'pathways'],
  port: '28015'
};

let envVars = _.pick( process.env, Object.keys( defaults ) );

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;