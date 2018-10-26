// Entity summary
const _ = require('lodash');

//To be moved and integrated with all the other 'datasource'
// Value is the MIRIAM recommended name
const DATASOURCE_NAMES = {
  HGNC: 'HGNC',
  HGNC_SYMBOL: 'HGNC Symbol',
  UNIPROT: 'UniProt Knowledgebase',
  NCBI_GENE: 'NCBI Gene',
  ENSEMBL: 'Ensembl'
};

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

module.exports = { EntitySummary, DATASOURCE_NAMES, DATASOURCES };