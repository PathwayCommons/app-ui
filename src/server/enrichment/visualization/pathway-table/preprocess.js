const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pathwayData = fs.readFileSync(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt')).toString('utf8').split('\n');

// pathwayInfoTable is map where the keys are GO/REACTOME pathway identifiers
// and values are description and geneset
const pathwayInfoTable = new Map();
_.forEach(pathwayData, pathwayInfo => {
  const pathways = pathwayInfo.split('\t');
  const geneset = [];
  const pathwayIdIndex = 0;
  const descriptionIndex = 1;
  const geneStartIndex = 2;
  for(let i = geneStartIndex; i < pathways.length; ++i) {
    geneset.push(pathways[i]);
  }
  pathwayInfoTable.set(pathways[pathwayIdIndex], { 'description': pathways[descriptionIndex], 'geneset': geneset });
});
pathwayInfoTable.delete('');


module.exports = { pathwayInfoTable };