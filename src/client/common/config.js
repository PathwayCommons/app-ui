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

const databasesHomePages = [
  ['BioGrid', 'https://thebiogrid.org/'],
  ['DrugBank', 'https://www.drugbank.ca/'],
  ['mirtarBase', 'http://mirtarbase.mbc.nctu.edu.tw/php/index.php'],
  ['NetPath', 'http://www.netpath.org'],
  ['Panther', 'http://www.pantherdb.org/'],
  ['PID', 'http://www.ndexbio.org/#/'],
  ['PhosphoSitePlus', 'https://www.phosphosite.org/homeAction.action'],
  ['Reactome', 'https://reactome.org/'],
  ['SMPD', 'http://smpdb.ca/'],
  ['Wikipathways', 'https://www.wikipathways.org/index.php/WikiPathways'],
  ['UniProt', 'http://www.uniprot.org/'],
  ['HGNC Symbol', 'https://www.genenames.org/'],
  ['HGNC', 'https://www.genenames.org/'],
  ['ChEBI', 'https://www.ebi.ac.uk/chebi/'],
  ['KEGG', 'http://www.genome.jp/kegg/'],
  ['PubMed', 'https://www.ncbi.nlm.nih.gov/pubmed/'],
  ['Ensembl', 'https://www.ensembl.org/index.html'],
  ['Enzyme Nomenclature', 'http://www.sbcs.qmul.ac.uk/iubmb/enzyme/'],
  ['PubChem-Substance', 'https://pubchem.ncbi.nlm.nih.gov/'],
  ['3DMET', 'http://www.3dmet.dna.affrc.go.jp/'],
  ['Chemical Component Dictionary', 'https://www.wwpdb.org/data/ccd'],
  ['CAS', 'https://www.cas.org/']
];

const publicationsURL = 'http://identifiers.org/pubmed/';
const tooltipOrder = ['Type', 'Standard Name', 'Display Name', 'Names', 'Database IDs', 'Publications'];
const tooltipReverseOrder = ['Comment'];

const defaultEntryLimit = 3;
const commentEntryLimit = 1;

const tippyDefaults = {
  theme: 'dark',
  position: 'right',
  animation: 'scale',
  animateFill: false,
  duration: [ 500, 0 ],
  delay: [ 0, 0 ],
  hideDuration: 0,
  arrow: true,
  trigger: 'mouseenter',
  interactive: true,
  multiple: true,
  hideOnClick: true,
  sticky: true
};

module.exports = {
  databases,
  databasesHomePages,
  publicationsURL,
  tooltipOrder,
  tooltipReverseOrder,
  defaultEntryLimit,
  commentEntryLimit,
  tippyDefaults
};

/*
  ['KEGG Reaction', 'http://www.genome.jp/', 'dbget-bin/www_bget?rn:'],
  ['KEGG Compound', 'http://www.genome.jp/', 'dbget-bin/www_bget?cpd:'],
  ['KEGG Drug', 'http://www.genome.jp/', 'dbget-bin/www_bget?drg:'],
*/