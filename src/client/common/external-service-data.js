const { IDENTIFIERS_URL } = require('../../config');

let externalServiceData = [
  {database:'Reactome', url:'http://identifiers.org/reactome/', search:''},
  {database:'UniProt', url:'http://identifiers.org/uniprot/', search:''},
  {database:'HGNC Symbol', url:'http://identifiers.org/hgnc.symbol/', search:''},
  {database:'HGNC', url:'http://identifiers.org/hgnc/', search:''},
  {database:'ChEBI', url:'http://identifiers.org/chebi/', search:''},
  {database:'PubMed', url:'http://identifiers.org/pubmed/', search:''},
  {database:'Ensembl', url:'http://identifiers.org/ensembl/', search:''},
  {database:'NCBI Gene',url:'http://identifiers.org/ncbigene/',search:''},
  {database:'Gene Cards',url:'http://identifiers.org/genecards/',search:''}
];

let generateIdentifiersUrl = ( db, id ) => `${IDENTIFIERS_URL}/${db}/${id}`;

module.exports = {
  externalServiceData,
  generateIdentifiersUrl
};