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

const addPathwayInfoLine = pathwayInfoTokens => {
  let PATHWAY_ID_INDEX = 0;
  let PATHWAY_NAME_INDEX = 1;
  let GENE_LIST_START_INDEX = 2;

  let id = pathwayInfoTokens[PATHWAY_ID_INDEX];
  let name = pathwayInfoTokens[PATHWAY_NAME_INDEX];
  let geneSet = pathwayInfoTokens.slice( GENE_LIST_START_INDEX );
  pathwayInfoTable.set(id, { id, name, geneSet } );
};

const getPathwayInfoTable = async function(){
  try {
    // Intialized and up to date
    if( mtime && mtime === lastModTime() ) return pathwayInfoTable;

    // Initialization
    if( _.isNull( mtime ) && _.isNull( lastModTime() ) ){
      await updateEnrichment();
      mtime = lastModTime();
      parser = initializeParser({
        delimiter: '\t',
        skip_empty_lines: true,
        relax_column_count: true
      }, addPathwayInfoLine );
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

module.exports = { getPathwayInfoTable,  };