const _ = require('lodash');

let defaults = {
  PORT: 3000,
  METADATA_CRON_SCHEDULE: '0 0 * * Monday', // update file from gprofiler etc. (Monday at midnight)
  PC_URL: 'https://www.pathwaycommons.org/',
  XREF_SERVICE_URL: 'https://biopax.baderlab.org/',
  DOWNLOADS_FOLDER_NAME: 'downloads',
  GPROFILER_URL: "https://biit.cs.ut.ee/gprofiler/",
  GMT_ARCHIVE_URL: 'https://biit.cs.ut.ee/gprofiler/static/gprofiler_hsapiens.name.zip',
  IDENTIFIERS_URL: 'https://identifiers.org',
  NCBI_EUTILS_BASE_URL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  NCBI_API_KEY: 'b99e10ebe0f90d815a7a99f18403aab08008', // for dev testing only (baderlabsysmonitor ncbi key)
  HGNC_BASE_URL: 'https://rest.genenames.org',
  UNIPROT_API_BASE_URL: 'https://www.ebi.ac.uk/proteins/api',
  PC_IMAGE_CACHE_MAX_SIZE: 10000,
  PC_CACHE_MAX_SIZE: 1000,
  PUB_CACHE_MAX_SIZE: 1000000,
  ENT_CACHE_MAX_SIZE: 1000000,
  ENT_SUMMARY_CACHE_MAX_SIZE: 1000000,
  MAX_SIF_NODES: 25,
  CLIENT_FETCH_TIMEOUT: 15000,
  SERVER_FETCH_TIMEOUT: 5000,
  // DB config values
  DB_NAME:  'appui',
  DB_HOST:  '127.0.0.1',
  DB_PORT: '28015',
  DB_USER: undefined,
  DB_PASS: undefined,
  DB_CERT: undefined,
  // factoid specific urls
  FACTOID_URL: 'http://unstable.factoid.baderlab.org/',
  NS_CHEBI: 'chebi',
  NS_ENSEMBL: 'ensembl',
  NS_GENECARDS: 'genecards',
  NS_GENE_ONTOLOGY: 'go',
  NS_HGNC: 'hgnc',
  NS_HGNC_SYMBOL: 'hgnc.symbol',
  NS_NCBI_GENE: 'ncbigene',
  NS_PUBMED: 'pubmed',
  NS_REACTOME: 'reactome',
  NS_UNIPROT: 'uniprot'
};

let envVars = _.pick( process.env, Object.keys( defaults ) );


// these vars are always included in the bundle because they ref `process.env.${name}` directly
// NB DO NOT include passwords etc. here
let clientVars = {
  NODE_ENV: process.env.NODE_ENV,
  PC_URL: process.env.PC_URL,
  FACTOID_URL: process.env.FACTOID_URL
};

_.assign(envVars, clientVars);

for( let key in envVars ){
  let val = envVars[key];

  if( val === '' || val == null ){
    delete envVars[key];
  }
}

let conf = Object.assign( {}, defaults, envVars );

Object.freeze( conf );

module.exports = conf;
