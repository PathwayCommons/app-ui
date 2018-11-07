// Entity summary
const _ = require('lodash');

//To be moved and integrated with all the other 'datasource'
const DATASOURCES = {
  NCBIGENE: 'http://identifiers.org/ncbigene/',
  HGNC: 'http://identifiers.org/hgnc/',
  UNIPROT: 'http://identifiers.org/uniprot/',
  GENECARDS: 'http://identifiers.org/genecards/'
};

const DEFAULTS = {
  dataSource: '',
  displayName: '',
  localID: '',
  description: '',
  aliases: [],
  aliasIds: [],
  xref: {}
};

class EntitySummary {
  constructor( options ){
    _.assign(this, DEFAULTS, options );
  }
}

module.exports = { EntitySummary, DATASOURCES };