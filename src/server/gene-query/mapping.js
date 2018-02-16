
const fs = require("fs");
const path = require("path");
const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "HGNC_dataset.json")));
const jsonContent = new Map();
jsonData.forEach(el => jsonContent.set(el['Approved Symbol'], el['HGNC ID']));


// map HGNC symbol to HGNC ID
// After validation step, we can assume all symbols are valid
// so that we can find a mapping for sure
const mapping = function (hgncSymbol) {
  const validSymbol = jsonContent.has(hgncSymbol);
  if(validSymbol) {
    return jsonContent.get(hgncSymbol);
  }
  return null;
};






module.exports = mapping;