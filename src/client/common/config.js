const conf = require("../../config");
const PC_URI = conf.PC_URI;

const databases = [
  {database:'BioGrid', url:'http://identifiers.org/biogrid/', search:''},
  {database:'DrugBank', url:'https://www.drugbank.ca/', search:''},
  {database:'mirtarBase', url:'http://identifiers.org/mirtarbase/', search:''},
  {database:'NetPath', url:'http://www.netpath.org/', search:'molecule?molecule_id='},
  {database:'Panther', url:'http://pantherdb.org/', search:'genes/geneList.do?searchType=basic&fieldName=all&organism=all&listType=1&fieldValue='},
  {database:'PID', url:null},
  {database:'PhosphoSitePlus', url:null},
  {database:'Reactome', url:'http://identifiers.org/reactome/', search:''},
  {database:'SMPD', url:null},
  {database:'Wikipathways', url:'http://identifiers.org/wikipathways/' , search:''},
  {database:'Uniprot', url:'http://identifiers.org/uniprot/', search:''},
  {database:'HGNC Symbol', url:'http://identifiers.org/hgnc.symbol/', search:''},
  {database:'HGNC', url:'http://identifiers.org/hgnc/', search:''},
  {database:'ChEBI', url:'http://identifiers.org/chebi/', search:''},
  {database:'KEGG', url:'http://identifiers.org/kegg/', search:''},
  {database:'PubMed', url:'http://identifiers.org/pubmed/', search:''},
  {database:'Ensembl', url:'http://identifiers.org/ensembl/', search:''},
  {database:'Enzyme Nomenclature', url:'http://identifiers.org/ec-code/', search:''},
  {database:'PubChem-Substance', url:'http://identifiers.org/pubchem.substance/', search:''},
  {database:'3DMET', url:'http://identifiers.org/3dmet/', search:''},
  {database:'Chemical Component Dictionary', url:'http://identifiers.org/pdb-ccd/', search:''},
  {database:'CAS', url:'http://identifiers.org/cas/', search:''},
  {database:'HPRD',url:'http://identifiers.org/hprd/',search:''},
  {database:'RefSeq',url:'http://identifiers.org/refseq/',search:''},
  {database:'Pathway Commons',url:PC_URI,search:''},
  {database:'NCBI Gene',url:'http://identifiers.org/ncbigene/',search:''},
  {database:'Gene Cards',url:'http://identifiers.org/genecards/',search:''}
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