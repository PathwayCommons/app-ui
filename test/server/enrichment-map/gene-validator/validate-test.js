const chai = require('chai');
const expect = chai.expect;
const {validatorGconvert} = require('../../../../src/server/enrichment-map/gene-validator/index');

describe('test validatorGconvert', function() {
  it('it should return an object', function() {
    return (validatorGconvert('TP53 ATP ATM TP53')).then(function(res) {
      expect(res).to.deep.equal({"unrecogized":["ATP"],"duplicate":["TP53"],"geneInfo":[{"HGNC_symbol":"TP53","HGNC_id":"HGNC:11998"},{"HGNC_symbol":"ATM","HGNC_id":"HGNC:795"},{"HGNC_symbol":"TP53","HGNC_id":"HGNC:11998"}]});
    });
  });
});