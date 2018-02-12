const tokenize = require('./tokenize');
const mapping = require('./mapping');
const _ = require('lodash');

class token {
  constructor(symbol) {
    this.HgncSymbol = symbol;
    this.HgncId = "";
    this.duplicate = false;
    this.legal = true;
  }
}

// whole validation procedure
// take input
// tokenize
// call token ctor for each symbol, mapping, set legal field
// check for duplicate, set dup field
const validate = function(input) {
  const listOfSymbol = tokenize(input);
  let listOfToken = [];

  // construct tokens
  listOfSymbol.forEach(element => {
    listOfToken.push(new token(element));
  });

  // mapping, check for illegal symbols
  listOfToken.forEach(element => {
    if(!mapping(element.HgncSymbol)) {
      element.legal = false;
    } else {
      element.HgncId = mapping(element.HgncSymbol);
    }
  });

  // check duplicates
  _.forEach(listOfToken, function(element) {
    const fil = _.filter(listOfSymbol, function(el){
      return el == element.HgncSymbol;
    });
    if (fil.length > 1) {
      element.duplicate = true;
    }
  });

  return listOfToken;
};

// determins if input can be proceeded to next service
// true => output gene info
// false => output all relevant error messages
//          unrecognized gene symbols
//          duplicate gene symbols
const proceed = function(listOfToken) {
  let errorMessage = [];
  let geneInfo = [];
  listOfToken.forEach(element => {
    if (element.legal == false) {
      errorMessage.push(element.HgncSymbol+" is not recognized");
    } else if (element.duplicate == true) {
      errorMessage.push(element.HgncSymbol+" is a duplicate");
    }
    geneInfo.push({HGNC_symbol: element.HgncSymbol, HGNC_id: element.HgncId});
  });
  if (errorMessage.length != 0) return errorMessage;
  return geneInfo;
};

module.exports = {validate, proceed};
