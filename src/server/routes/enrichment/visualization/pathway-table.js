const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');

const { GMT_SOURCE_FILENAME } = require('../../../../config');
const { updateEnrichment } = require('./update-enrichment');

const GMT_SOURCE_PATH = path.resolve(__dirname, GMT_SOURCE_FILENAME);
const readFile = Promise.promisify(fs.readFile);
const stat = Promise.promisify(fs.stat);

let lastModTime = null;
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

const createPathwayInfoTable = async () => {
  const gmtPathwayData = await readFile(GMT_SOURCE_PATH, { encoding: 'utf8' });
  return formatPathwayInfoTable( gmtPathwayData );
};

const getPathwayInfoTable = async function(){
  
  try {
    const fileStats = await stat(GMT_SOURCE_PATH);
    const thisModTime = fileStats.mtimeMs;

    if( thisModTime === lastModTime ){
      return pathwayInfoTableCache;
    } else {
      lastModTime = thisModTime;
      return createPathwayInfoTable();
    }

  } catch ( e ) {
    
    const updated = await updateEnrichment();
    if( !updated ) throw e;

    const fileStats = await stat(GMT_SOURCE_PATH);
    lastModTime = fileStats.mtimeMs;
   
    return createPathwayInfoTable();
  }
};

module.exports = { getPathwayInfoTable };