const fs = require("fs");
const path = require("path");
const _ = require('lodash');
const jsonContent = new Map();


const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "HGNC_dataset.json")));
_.forEach(jsonData, ele => jsonContent.set(ele['Approved Symbol'], ele['HGNC ID']));


// map HGNC symbol to HGNC ID
// returns null if not found
const mapping = (hgncSymbol) => {
  if (jsonContent.has(hgncSymbol)) {
    return jsonContent.get(hgncSymbol);
  }
  return null;
};


module.exports = {mapping};