const chai = require('chai');
const expect = chai.expect;
const {validatorGconvert} = require('../../../../src/server/enrichment/validation');

describe('test validatorGconvert', function() {
  this.timeout(500000);
  it('it should return an object', function() {
    return (validatorGconvert(['TP53', 'ATP', 'ATM', 'TP53'])).then(function(res) {
      const result = {
        "unrecognized": [
          "ATP"
        ],
        "duplicate": {
          "HGNC:11998": [
            "TP53"
          ]
        },
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