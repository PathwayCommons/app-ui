const chai = require('chai');

const geneListValidator = require('../src/server/gene-query');
const expect = chai.expect;
const assert = chai.assert;



describe('Gene query', function () {
  describe('single valid human gene symbol', function () {
    it('it should return a good input response', function () {
      const goodInput = ['AFF4'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['NAP1L3'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['BRPF1'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['TCF20'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
  });

  describe('multiple valid human gene symbols', function () {
    it('it should return a good input response', function () {
      const goodInput = ['AFF4', 'HLTF'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['NAP1L3', 'HLTF'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['BRPF1', 'TDG'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['TCF20', 'DPY30'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
  });

  describe('multiple valid human gene symbols', function () {
    it('it should return a good input response', function () {
      const goodInput = ['ING5', 'USP27X', 'SCML2', 'PCGF5', 'GTF2H1'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['SUPT16H', 'TRIM24', 'KDM3A', 'PAF1', 'NCOA1', 'UBE2B', 'JMJD6'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
    it('it should return a good input response', function () {
      const goodInput = ['NAP1L3', 'TCF20', 'MLLT6', 'SIRT1', 'TRIM24', 'PAF1', 'SIRT1', 'TDG'];
      const result = geneListValidator(goodInput);
      expect(result).to.equal({ msg: "input is good" });
    });
  });




  describe('single invalid gene symbol', function () {
    it('it should return a bad input response', function () {
      const badInput = ['YY50'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['YY51'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['YY52'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['YY53'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
  });

  describe('single invalid gene symbol violating naming rules', function () {
    it('it should return a bad input response', function () {
      const badInput = ['8LL'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['@34'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['H;LL'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['ii&'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
  });

  describe('duplicate inputs', function() {
    it('it should return a bad response', function() {
      const badInput = ['AFF4', 'AFF4'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad response', function() {
      const badInput = ['AFF4', 'BRPF1', 'AFF4'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad response', function() {
      const badInput = ['HLTF', 'SIRT1', 'ING5', 'SIRT1'] ;
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad response', function() {
      const badInput = ['ELP4', 'HCFC1', 'TRIM24', 'KDM3A', 'PAF1', 'HCFC1', 'TRIM24'] ;
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
  });

  describe('mix of valid and invalid human gene symbols', function () {
    it('it should return a bad input response', function () {
      const badInput = ['AFF4', 'YY51'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['NAP1L3', 'YY52'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['BRPF1', 'YY53'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['YY54', 'DPY30'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
  });

  describe('mix of valid and invalid human gene symbols', function () {
    it('it should return a bad input response', function () {
      const badInput = [['ING5', 'YY50', 'SCML2', 'YY52', 'GTF2H1'],
      ['SUPT16H', 'YY50', 'KDM3A', 'PAF1', 'YY51', 'UBE2B', 'YY53'],
      ['SUPT16H', 'TRIM24', 'KDM3A', 'H;LL', 'NCOA1', 'UBE2B', 'JMJD6'],
      ['SUPT16H', 'TRIM24', 'KDM3A', 'PAF1', 'ii&', 'UBE2B', 'JMJD6']];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['ING5', 'YY50', 'SCML2', 'YY52', 'GTF2H1'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['SUPT16H', 'YY50', 'KDM3A', 'PAF1', 'YY51', 'UBE2B', 'YY53'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['SUPT16H', 'TRIM24', 'KDM3A', 'H;LL', 'NCOA1', 'UBE2B', 'JMJD6'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });
    it('it should return a bad input response', function () {
      const badInput = ['SUPT16H', 'TRIM24', 'KDM3A', 'PAF1', 'ii&', 'UBE2B', 'JMJD6'];
      const result = geneListValidator(badInput);
      expect(result).to.equal({ msg: "input is bad" });
    });

  });
});
