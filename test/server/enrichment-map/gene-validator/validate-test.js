const chai = require('chai');
const expect = chai.expect;
const {validatorGconvert} = require('../../../../src/server/enrichment-map/gene-validator/index');

describe('test validatorGconvert', function() {
  it('it should return an object', function() {
    return (validatorGconvert('TP53 ATP ATM TP53')).then(function(res) {
      const result = {
        "options": {
          "target": "HGNC",
          "organism": "hsapiens"
        },
        "unrecognized": [
          "ATP"
        ],
        "duplicate": [
          "TP53"
        ],
        "geneInfo": [
          {
            "initialAlias": "TP53",
            "convertedAlias": "HGNC:11998"
          },
          {
            "initialAlias": "ATM",
            "convertedAlias": "HGNC:795"
          }
        ]
      };
      expect(res).to.deep.equal(result);
    });
  });
});