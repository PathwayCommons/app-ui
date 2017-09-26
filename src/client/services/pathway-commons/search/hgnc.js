const fetch = require('whatwg-fetch');

const symbolNameBlackList = [
  'CELL'
];

const parseHGNCData = text => {
  // the first line of the file is nonsense, remove it.
  let i = text.indexOf('\n') + 1;
  let textNoHeader = text.substr(i).toUpperCase();

  let parsed = textNoHeader.split(/[\s,]+/)
    .filter(symbol => {
      if (symbol.length > 0 || symbolNameBlackList.indexOf(symbol) == -1) {
        return true;
      }
      return false;
    });

  return parsed;
};

module.exports = (filename) => {
  return fetch(filename, {method: 'get', mode: 'no-cors'})
  .then(res => res.text())
  .then(parseHGNCData)
  .then(hgncSymbols => new Set(hgncSymbols));
};