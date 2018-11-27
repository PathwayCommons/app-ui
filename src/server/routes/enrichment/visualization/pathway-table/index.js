const fs = require('fs');
const path = require('path');
const gmtPathwayData = fs.readFileSync(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt')).toString('utf8');

// pathwayInfoTable is map where the keys are GO/REACTOME pathway identifiers
// and values are description and geneset
const pathwayInfoTable = new Map();

gmtPathwayData.split('\n').forEach( pathwayInfoLine => {
  let pathwayInfoTokens = pathwayInfoLine.split('\t');
  let PATHWAY_ID_INDEX = 0;
  let DESCRIPTION_INDEX = 1;
  let GENE_LIST_START_INDEX = 2;

  let pathwayId = pathwayInfoTokens[PATHWAY_ID_INDEX];
  let description = pathwayInfoTokens[DESCRIPTION_INDEX];
  let geneSet = [];

  for( let i = GENE_LIST_START_INDEX; i < pathwayInfoTokens.length; ++i ){
    geneSet.push(pathwayInfoTokens[i]);
  }

  pathwayInfoTable.set(pathwayId, { pathwayId, description, geneSet } );
} );

pathwayInfoTable.delete('');


module.exports = { pathwayInfoTable };