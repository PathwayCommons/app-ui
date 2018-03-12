const fs = require('fs');
const path = require('path');
const _ = require('lodash');


// create table (17489 items in total) from 'hsapiens.pathways.NAME.gmt'
// key: GO/REACTOME ID
// value: {"description":..., "geneset":...}
const data = fs.readFileSync(path.resolve(__dirname, 'hsapiens.pathways.NAME.gmt')).toString('utf8').split('\n');
const table = new Map();
_.forEach(data, pathwayInfo => {
  const tmp = pathwayInfo.split('\t');
  const geneset = [];
  for(let i = 2; i < tmp.length; ++i) {
    geneset.push(tmp[i]);
  }
  table.set(tmp[0], { 'description': tmp[1], 'geneset': geneset });
});
table.delete('');


module.exports = {table};