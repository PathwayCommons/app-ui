const fs = require('fs');
const path = require('path');
const _ = require('lodash');


// create table (17489 items in total) from 'hsapiens.pathways.NAME.gmt'
// key: GO/REACTOME ID
// value: {"description":..., "geneset":...}
const pathwayData = fs.readFileSync(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt')).toString('utf8').split('\n');
const pathwayInfoTable = new Map();
_.forEach(pathwayData, pathwayInfo => {
  const pathwayInfoList = pathwayInfo.split('\t');
  const geneset = [];
  const pathwayIdIndex = 0;
  const descriptionIndex = 1;
  const geneStartIndex = 2;
  for(let i = geneStartIndex; i < pathwayInfoList.length; ++i) {
    geneset.push(pathwayInfoList[i]);
  }
  pathwayInfoTable.set(pathwayInfoList[pathwayIdIndex], { 'description': pathwayInfoList[descriptionIndex], 'geneset': geneset });
});
pathwayInfoTable.delete('');


module.exports = {pathwayInfoTable};