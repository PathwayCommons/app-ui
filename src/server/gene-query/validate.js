/*
documentation for validator
sample requset URL: http://localhost:3000/api/gene-query/?gene=HCFC1,ATM
parameter:
gene - [string] a list of gene symbols delimited by commas
return:
[vector of Object] if gene symbol list is valid, return each gene info including HGNC symbol and HGNC id; otherwise, return relevant error message
*/

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

const count = function (arr, key) {
  const fil = _.filter(arr, function (el) {
    return el == key;
  });
  return fil.length;
};

// whole validation procedure
// take input
// tokenize
// call token ctor for each symbol, mapping, set legal field
// check for duplicate, set dup field
const validate = function (input) {
  const listOfSymbol = tokenize(input);
  let listOfToken = [];

  // construct tokens
  listOfSymbol.forEach(element => {
    listOfToken.push(new token(element));
  });

  // mapping, check for illegal symbols
  listOfToken.forEach(element => {
    if (!mapping(element.HgncSymbol)) {
      element.legal = false;
    } else {
      element.HgncId = mapping(element.HgncSymbol);
    }
  });


  _.forEach(listOfToken, function (element) {
    const fil = _.filter(listOfSymbol, function (el) {
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
// json response examples on github issue #401
const proceed = function (listOfToken) {
  let unrecognized = [];
  let duplicate = [];
  let geneInfo = [];
  listOfToken.forEach(element => {
    if (element.legal == false || element.duplicate == true) {
      if (element.legal == false) {
        if (count(unrecognized, element.HgncSymbol) == 0) {
          unrecognized.push(element.HgncSymbol);
        }
      }
      if (element.duplicate == true) {
        if (count(duplicate, element.HgncSymbol) == 0) {
          duplicate.push(element.HgncSymbol);
        }
      }
    } else {
      geneInfo.push({ HGNC_symbol: element.HgncSymbol, HGNC_id: element.HgncId });
    }
  });
  return { "unrecognized": unrecognized, "duplicate": duplicate, "geneInfo": geneInfo };
};

const validator = (input) => {
  return proceed(validate(input));
};

module.exports = { validator };
