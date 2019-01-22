const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const { GPROFILER_URL } = require('../../../../config');
const GMT_ARCHIVE_URL = GPROFILER_URL + 'gmt/gprofiler_hsapiens.NAME.gmt.zip';
const GMT_FILENAME = 'hsapiens.pathways.NAME.gmt';

const readFile = Promise.promisify(fs.readFile);

const getPathwayInfoTable = async function(){
  // TODO check file for modifications before processing again

  console.log('GET TABLE');

  const gmtPathwayData = await readFile(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt'), { encoding: 'utf8' });

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

  return pathwayInfoTable;
};

/**
 * handleFileUpdate
 * When a cron job to update the file is triggered, this function is called with the fresh file.
 * @external file
 * @see {@link https://www.npmjs.com/package/unzipper}
 */
const handleFileUpdate = file => file.stream().pipe( fs.createWriteStream( path.resolve( __dirname, file.path ) ) );

module.exports = { getPathwayInfoTable, handleFileUpdate, GMT_ARCHIVE_URL, GMT_FILENAME };