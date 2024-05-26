const { IDENTIFIERS_URL } = require('../../config');

let externalServiceData = [
  {database:'Reactome', url:'http://bioregistry.io/reactome:', search:''},
  {database:'UniProt', url:'http://bioregistry.io/uniprot:', search:''},
  {database:'HGNC Symbol', url:'http://bioregistry.io/hgnc.symbol:', search:''},
  {database:'HGNC', url:'http://bioregistry.io/hgnc:', search:''},
  {database:'ChEBI', url:'http://bioregistry.io/chebi:', search:''},
  {database:'PubMed', url:'http://bioregistry.io/pubmed:', search:''},
  {database:'Ensembl', url:'http://bioregistry.io/ensembl:', search:''},
  {database:'NCBI Gene',url:'http://bioregistry.io/ncbigene:',search:''},
  {database:'Gene Cards',url:'http://bioregistry.io/genecards:',search:''}
];

let generateIdentifiersUrl = ( db, id ) => `${IDENTIFIERS_URL}/${db}:${id}`;

module.exports = {
  externalServiceData,
  generateIdentifiersUrl
};