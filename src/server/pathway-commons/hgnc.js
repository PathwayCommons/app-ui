const _ = require('lodash');
const fs = require('fs');
const symbolNameBlackList = [
  'CELL'
];

const parseHGNCData = text => {
  // the first line of the file is nonsense, remove it.
  let i = text.indexOf('\n') + 1;
  let textNoHeader = text.substr(i).toUpperCase();

  let parsed = textNoHeader.split(/[\s,]+/)
    .filter(symbol => {
      return symbol.length > 0 && symbolNameBlackList.indexOf(symbol) == -1;
    });

  return parsed;
};

module.exports = _.memoize((filename) => {
  let symbols = fs.readFileSync(filename, 'utf-8');
  return new Promise ((resolve, reject) => resolve(new Set(parseHGNCData(symbols))));
}, fname => fname);
