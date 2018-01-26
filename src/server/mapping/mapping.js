
const fs = require("fs");
const path = require("path");
const jsonData = fs.readFileSync(path.resolve(__dirname, "Validation_test_data_set.json"));
const jsonContent = JSON.parse(jsonData);


// map HGNC symbol to HGNC ID
// After validation step, we can assume all symbols are valid
// so that we can find a mapping for sure
const mapping = function(symbol) {
  let id = 0;
  jsonContent.forEach(element => {
    if (element['FIELD1'] === symbol) {
      id = element['FIELD2'];
    }
  });
  return id;
};


module.exports = mapping;