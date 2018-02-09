const tokenize = require('./tokenize');
const mapping = require('./mapping');
const _ = require('lodash');

class token {
  constructor(symbol) {
    this.symbol = symbol;
    this.id = "";
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
    if(!mapping(element.symbol)) {
      element.legal = false;
    } else {
      element.id = mapping(element);
    }
  });

  // check duplicates
  _.forEach(listOfToken, function(element) {
    const fil = _.filter(listOfSymbol, function(el){
      return el == element.symbol;
    });
    if (fil.length > 1) {
      element.duplicate = true;
    }
  });

  return listOfToken;
};

// determins if input can be proceeded to next service
const proceed = function(listOfToken) {
  let ret = true;
  listOfToken.forEach(element => {
    if (element.legal == false || element.duplicate == true) {
      ret = false;
    }
  });
  return ret;
};

module.exports = {validate, proceed};
