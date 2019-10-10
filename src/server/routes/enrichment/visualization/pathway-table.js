const _ = require('lodash');
const parse = require('csv').parse;

const logger = require('../../../logger');
const { updateEnrichment, lastModTime } = require('./update-enrichment');

let pathwayInfoTableCache = null;

const formatPathwayInfoTable = gmtPathwayData => {
  // pathwayInfoTable is map where the keys are GO/REACTOME pathway identifiers
  // and values are description and geneset
  const pathwayInfoTable = new Map();

  gmtPathwayData.split('\n').forEach( pathwayInfoLine => {
    let pathwayInfoTokens = pathwayInfoLine.split('\t');
    let PATHWAY_ID_INDEX = 0;
    let PATHWAY_NAME_INDEX = 1;
    let GENE_LIST_START_INDEX = 2;

    let id = pathwayInfoTokens[PATHWAY_ID_INDEX];
    let name = pathwayInfoTokens[PATHWAY_NAME_INDEX];
    let geneSet = [];

    for( let i = GENE_LIST_START_INDEX; i < pathwayInfoTokens.length; ++i ){
      geneSet.push(pathwayInfoTokens[i]);
    }

    pathwayInfoTable.set(id, { id, name, geneSet } );
  } );

  pathwayInfoTable.delete('');

  pathwayInfoTableCache = pathwayInfoTable;

  return pathwayInfoTable;
};

const parser = parse({ delimiter: '\t' });
parser.on( 'readable', () => {
  let record;
  while ( record = parser.read() ) {
    output.push(record)
  }
})

const createPathwayInfoTable = async () => {
  return formatPathwayInfoTable( gmtPathwayData );
};

const getPathwayInfoTable = async function(){
  try {
    if( _.isNull( sourceFilePaths ) ) sourceFilePaths = await updateEnrichment();

    const fileStats = await stat( _.head( sourceFilePaths ) );
    const thisModTime = fileStats.mtimeMs;

    if( thisModTime === lastModTime ){
      return pathwayInfoTableCache;
    } else {
      lastModTime = thisModTime;
      return createPathwayInfoTable();
    }

  } catch ( e ) {
    logger.error( `A problem was encountered: ${e}` );
    throw e;
  }
};

module.exports = { getPathwayInfoTable, formatPathwayInfoTable };