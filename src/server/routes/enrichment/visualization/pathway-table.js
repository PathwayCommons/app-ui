const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const MultiStream = require('multistream');

const { GPROFILER_URL } = require('../../../../config');
const GMT_ARCHIVE_URL = GPROFILER_URL + 'static/gprofiler_hsapiens.name.zip';
const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];
const GMT_SOURCE_FILENAME = 'pathways.gmt';

const readFile = Promise.promisify(fs.readFile);
const stat = Promise.promisify(fs.stat);
const FILEPATH = path.resolve(__dirname, GMT_SOURCE_FILENAME);

let lastModTime = null;
let pathwayInfoTableCache = null;

const getPathwayInfoTable = async function(){
  const fileStats = await stat(FILEPATH);
  const thisModTime = fileStats.mtimeMs;

  if( thisModTime === lastModTime ){
    return pathwayInfoTableCache;
  } else {
    lastModTime = thisModTime;

    // allow the function to continue to update the table...
  }

  const gmtPathwayData = await readFile(FILEPATH, { encoding: 'utf8' });

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

/**
 * handleFileUpdate
 * When a cron job to update the file is triggered, this function is called with the fresh file.
 * @external files list of file
 * @see {@link https://www.npmjs.com/package/unzipper}
 */
const handleFileUpdate = files =>  MultiStream( files.map( f => f.stream() ) ).pipe( fs.createWriteStream( FILEPATH ) );

module.exports = { getPathwayInfoTable, handleFileUpdate, GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES };