const fs = require('fs');
const path = require('path');

const { GPROFILER_URL } = require('../../../../config');
const GMT_ARCHIVE_URL = GPROFILER_URL + 'gmt/gprofiler_hsapiens.NAME.gmt.zip';
const GMT_FILENAME = 'hsapiens.pathways.NAME.gmt';
const gmtPathwayData = fs.readFileSync(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt')).toString('utf8');

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

/**
 * handleFileUpdate
 * @external file
 * @see {@link https://www.npmjs.com/package/unzipper}
 */
const handleFileUpdate = file => file.stream().pipe( fs.createWriteStream( path.resolve( __dirname, file.path ) ) );

module.exports = { pathwayInfoTable, handleFileUpdate, GMT_ARCHIVE_URL, GMT_FILENAME };