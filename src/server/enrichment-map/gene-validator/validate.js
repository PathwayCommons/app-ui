/*
documentation for validator
sample request URL: http://localhost:3000/api/validator/?genes=HCFC1 ATM
parameter:
genes - [string] a list of gene symbols delimited by commas
return:
[vector of Object] if gene symbol list is valid, return each gene info including HGNC symbol and HGNC id; otherwise, return relevant error message
Potential risks:
1. We validate a gene that isn't recognized by GOSt
2. We invalidate a gene that is recognized by GOSt
Only 2 is detected in testing (e.g. 'TARP'). As long as our HGNC dataset is a subset of GOSt, we are okay.
If 1 is detected in the future, error message should be added.

Notes:
1. each symbol appears at most once in unrecognize, duplicate and geneInfo
2. If a symbol is unrecognized and duplicate, only report it in unrecognize.
3. If a symbol is recognized and duplicate, report it in duplicate and store info in geneInfo.
*/

const tokenize = require('./tokenize').tokenize;
const mapping = require('./mapping').mapping;
const _ = require('lodash');


class HgncInfo {
  constructor(symbol) {
    this.HgncSymbol = symbol;
    this.HgncId = '';
    this.duplicate = false;
    this.legal = true;
  }
}


const validate = (query) => {
  const HgncSymbolList = tokenize(query);
  let HgncInfoList = [];
  // construct tokens
  _.forEach(HgncSymbolList, ele => {
    HgncInfoList.push(new HgncInfo(ele));
  });
  // mapping, check for illegal symbols
  _.forEach(HgncInfoList, ele => {
    if (!mapping(ele.HgncSymbol)) {
      ele.legal = false;
    } else {
      ele.HgncId = mapping(ele.HgncSymbol);
    }
  });

  _.forEach(HgncInfoList, (ele) => {
    if (_.filter(HgncSymbolList, el => el === ele.HgncSymbol).length > 1) {
      ele.duplicate = true;
    }
  });
  return HgncInfoList;
};


// determins if input can be proceeded to next service
// true => output gene info
// false => output all relevant error messages
//          unrecognized gene symbols
//          duplicate gene symbols
// json response examples on github issue #401
const proceed = (HgncInfoList) => {
  let unrecognized = [];
  let duplicate = [];
  let geneInfo = [];

  _.forEach(HgncInfoList, elem => {
    if (!elem.legal) {
      if (_.filter(unrecognized, ele => ele === elem.HgncSymbol).length === 0) {
        unrecognized.push(elem.HgncSymbol);
      }
    } else {
      if (elem.duplicate && _.filter(duplicate, ele => elem.HgncSymbol === ele).length === 0) {
        duplicate.push(elem.HgncSymbol);
      }
      if (_.filter(geneInfo, ele => ele.HGNC_symbol === elem.HgncSymbol).length === 0) {
        geneInfo.push({ HGNC_symbol: elem.HgncSymbol, HGNC_id: elem.HgncId });
      }
    }
  });
  return { 'unrecognized': unrecognized, 'duplicate': duplicate, 'geneInfo': geneInfo };
};


const validator = (query) => {
  return proceed(validate(query));
};


module.exports = { validator };
