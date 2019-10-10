const _ = require('lodash');
const fs = require('fs');
const csv = require('csv');
const MultiStream = require('multistream');

const logger = require('../../../logger');
const { updateEnrichment, lastModTime, sourceFilePaths } = require('./update-enrichment');
const getReadStream = files => new MultiStream( files.map( f => fs.createReadStream( f ) ) );

let mtime = null;
let pathwayInfoTable = new Map();
let parser = null;

const initializeParser = ( opts, cb ) => {
  const parser = csv.parse( opts );

  parser.on( 'readable', () => {
    let line;
    while ( line = parser.read() ) cb( line ); // eslint-disable-line no-cond-assign
  });

  parser.on( 'error', err => {
    logger.error( `An problem was encoutered parsing ${err.message}` );
  });

  return parser;
};

const handleTokens = tokens => {
  const PATHWAY_ID_INDEX = 0;
  const PATHWAY_NAME_INDEX = 1;
  const GENE_LIST_START_INDEX = 2;
  const id = tokens[PATHWAY_ID_INDEX];
  const data = {
    id,
    name:tokens[PATHWAY_NAME_INDEX],
    geneSet: tokens.slice( GENE_LIST_START_INDEX )
  };
  pathwayInfoTable.set( id, data );
  return data;
};

const getPathwayInfoTable = async function(){
  try {
    // Intialized and up to date
    if( mtime && mtime === lastModTime() ) return pathwayInfoTable;

    // Initialization
    if( _.isNull( mtime ) ){
      await updateEnrichment();
      mtime = lastModTime();
      parser = initializeParser({
        delimiter: '\t',
        skip_empty_lines: true,
        relax_column_count: true
      }, handleTokens );
    // Update
    } else {
      mtime = lastModTime();
    }

    pathwayInfoTable.clear();
    getReadStream( sourceFilePaths() ).pipe( parser );
    return new Promise( resolve => parser.on( 'end', () => resolve( pathwayInfoTable ) ) );
  } catch ( e ) {
    logger.error( `A problem was encountered: ${e}` );
    throw e;
  }
};

module.exports = { getPathwayInfoTable, handleTokens };