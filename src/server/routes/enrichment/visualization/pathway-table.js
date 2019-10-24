const _ = require('lodash');
const fs = require('fs');
const csv = require('csv');
const MultiStream = require('multistream');

const logger = require('../../../logger');
const { updateEnrichment, lastModTime, sourceFilePaths } = require('./update-enrichment');
const getReadStream = files => new MultiStream( files.map( f => fs.createReadStream( f ) ) );

let mtime = null;
let pathwayInfoTable = new Map();

const initializeParser = ( opts, cb ) => {
  const parser = csv.parse( opts );

  parser.on( 'readable', () => {
    let line;
    while ( line = parser.read() ) cb( line ); // eslint-disable-line no-cond-assign
  });

  parser.on( 'error', err => {
    logger.error( `A problem was encountered in parser: ${err.message}` );
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
      if( _.isNull( lastModTime() ) ) await updateEnrichment();
      mtime = lastModTime();      
    // Update
    } else {
      mtime = lastModTime();
    }

    pathwayInfoTable.clear();
    const parser = initializeParser({
      delimiter: '\t',
      skip_empty_lines: true,
      relax_column_count: true
    }, handleTokens );
    getReadStream( sourceFilePaths() ).pipe( parser );
    return new Promise( resolve => parser.on( 'end', () => resolve( pathwayInfoTable ) ) );
  } catch ( e ) {
    logger.error( `A problem was encountered in getPathwayInfoTable: ${e}` );
    throw e;
  }
};

module.exports = { getPathwayInfoTable, handleTokens };