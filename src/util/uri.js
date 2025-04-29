const config = require('../config.js');

// Create file safe names from a uri
const uri2filename = s => s.replace(/[^a-z0-9]/gi, '_').toLowerCase();

// create from xref
const fromXref = ( namespace, localId ) => config.IDENTIFIERS_URL + '/' + namespace + ':' + localId;

module.exports = {
  uri2filename,
  fromXref
};