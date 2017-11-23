const databases = [
  ['BioGrid', 'http://identifiers.org/biogrid/', ''],
  ['DrugBank', 'https://www.drugbank.ca/', ''],
  ['mirtarBase', 'http://identifiers.org/mirtarbase/', ''],
  ['NetPath', 'http://www.netpath.org/', 'molecule?molecule_id='],
  ['Panther', 'http://pantherdb.org/', 'genes/geneList.do?searchType=basic&fieldName=all&organism=all&listType=1&fieldValue='],
  ['PID', null],
  ['PhosphoSitePlus', null],
  ['Reactome', 'http://identifiers.org/reactome/', ''],
  ['SMPD', null],
  ['Wikipathways', 'http://identifiers.org/wikipathways/' , ''],
  ['UniProt', '	http://identifiers.org/uniprot/', ''],
  ['HGNC Symbol', 'http://identifiers.org/hgnc.symbol/', ''],
  ['HGNC', 'http://identifiers.org/hgnc/', ''],
  ['ChEBI', 'http://identifiers.org/chebi/', ''],
  ['KEGG', 'http://identifiers.org/kegg/', ''],
  ['PubMed', 'http://identifiers.org/pubmed/', ''],
  ['Ensembl', 'http://identifiers.org/ensembl/', ''],
  ['Enzyme Nomenclature', 'http://identifiers.org/ec-code/', ''],
  ['PubChem-Substance', 'http://identifiers.org/pubchem.substance/', ''],
  ['3DMET', 'http://identifiers.org/3dmet/', ''],
  ['Chemical Component Dictionary', 'http://identifiers.org/pdb-ccd/', ''],
  ['CAS', 'http://identifiers.org/cas/', '']
];

const publicationsURL = 'http://identifiers.org/pubmed/';
const tooltipOrder = ['Type', 'Display Name', 'Standard Name', 'Names', 'Database IDs', 'Publications'];
const tooltipReverseOrder = ['Comment'];

module.exports = {
  databases,
  publicationsURL,
  tooltipOrder,
  tooltipReverseOrder
};

/*
  ['KEGG Reaction', 'http://www.genome.jp/', 'dbget-bin/www_bget?rn:'],
  ['KEGG Compound', 'http://www.genome.jp/', 'dbget-bin/www_bget?cpd:'],
  ['KEGG Drug', 'http://www.genome.jp/', 'dbget-bin/www_bget?drg:'],
*/