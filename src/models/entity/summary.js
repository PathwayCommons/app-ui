// Entity summary
const DATASOURCES = {
  NCBIGENE: 'http://identifiers.org/ncbigene/',
  HGNC: 'http://identifiers.org/hgnc/',
  UNIPROT: 'http://identifiers.org/uniprot/',
  GENECARDS: 'http://identifiers.org/genecards/'
};

class EntitySummary {
  constructor( dataSource, displayName, localID, description, aliasName, aliasId, xref ){
    this.dataSource = dataSource || '';
    this.displayName = displayName || '';
    this.localID = localID || '';
    this.description = description || '';
    this.aliasName = aliasName || [];
    this.aliasId = aliasId || [];
    this.xref = xref || {};
  }
}

module.exports = { EntitySummary, DATASOURCES };