
const fs = require("fs");
const path = require("path");
const jsonData = fs.readFileSync(path.resolve(__dirname, "HGNC.json"));
const jsonContent = JSON.parse(jsonData);


// map HGNC symbol to HGNC ID
// returns null if symbol not found
const mapping = function(hgncSymbol) {
  let id = null;
  jsonContent.forEach(element => {
    if (element['Approved_Symbol'] === hgncSymbol) {
      id = element['HGNC_ID'];
    }
  });
  return id;
};


module.exports = mapping;