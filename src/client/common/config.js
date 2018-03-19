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
  ['CAS', 'http://identifiers.org/cas/', ''],
  ['Pathway Commons','/view?uri=http://pathwaycommons.org/pc2/',''],
  ['HPRD','	http://identifiers.org/hprd/',''],
  ['RefSeq','	http://identifiers.org/refseq/',''],
  ['Entrez Gene','http://www.ncbi.nlm.nih.gov/gene/','']
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

const downloadTypes = [
  { type: 'png', displayName: 'Image (PNG)', ext: 'png', description: 'Download an image of the entire view.' },
  { type: 'gmt', displayName: 'GMT', pc2Name: 'GSEA', ext: 'gmt', description: 'Gene Matrix Transposed format. The gene database of named gene sets (UniProt) useful for performing enrichment analysis using Gene Set Enrichment Analysis (GSEA)' },
  { type: 'sif', displayName: 'SIF', pc2Name: 'SIF', ext: 'txt', description: 'Simple interaction format (SIF) is a list of interaction pairs useful for viewing, styling, and editing using Cytoscape desktop software, and for analysis with graph algorithms.' },
  { type: 'txt', displayName: 'Extended SIF', pc2Name: 'TXT', ext: 'txt', description: 'Similar to the SIF output, but contains extra information on entities and interactions. See the SIF section on the PC2 formats page for more details.' },
  { type: 'biopax', displayName: 'BioPAX', pc2Name: 'BIOPAX', ext: 'xml', description: 'Biological Pathways Exchange (BioPAX) format includes all details of the biological network stored in Pathway Commons. It is recommended that this format be interpreted using tools like Paxtools or Jena SPARQL.' },
  { type: 'jsonld', displayName: 'JSON-LD', pc2Name: 'JSONLD', ext: 'json', description: 'JSON-LD is a human-readable linked format. This format is ideal for programming environments, REST web services, and unstructured databses.' },
  { type: 'sbgn', displayName: 'SBGN-ML', pc2Name: 'SBGN', ext: 'xml', description: 'Systems Biology Graphical Notation (SBGN) is a standard visual notation for biological networks. This download provides an XML in SBGN markup language (SBGN-ML).' }
];


module.exports = {
  databases,
  publicationsURL,
  tooltipOrder,
  tooltipReverseOrder,
  defaultEntryLimit,
  commentEntryLimit,
  tippyDefaults,
  downloadTypes
};

/*
  ['KEGG Reaction', 'http://www.genome.jp/', 'dbget-bin/www_bget?rn:'],
  ['KEGG Compound', 'http://www.genome.jp/', 'dbget-bin/www_bget?cpd:'],
  ['KEGG Drug', 'http://www.genome.jp/', 'dbget-bin/www_bget?drg:'],
*/