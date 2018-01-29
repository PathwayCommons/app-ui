
const fs = require("fs");
const path = require("path");
const jsonData = fs.readFileSync(path.resolve(__dirname, "HGNC.json"));
const jsonContent = JSON.parse(jsonData);


// map HGNC symbol to HGNC ID
// After validation step, we can assume all symbols are valid
// so that we can find a mapping for sure
const mapping = function(hgncSymbol) {
  let id = 0;
  jsonContent.forEach(element => {
    if (element['Approved_Symbol'] === hgncSymbol) {
      id = element['HGNC_ID'];
    }
  });
  return id;
};


module.exports = mapping;