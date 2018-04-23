const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const { enrichment } = require('../../../../src/server/enrichment-map/enrichment');


describe('test enrichment', function () {
  this.timeout(500000);
  it('it should return an object', function () {
    return (enrichment(['AFF4'])).then(function (res) {
      const result = {
        "pathwayInfo": {
          "GO:0006354": {
            "p-value": 0.0087,
            "description": "DNA-templated transcription, elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "GO:0006368": {
            "p-value": 0.0087,
            "description": "transcription elongation from RNA polymerase II promoter",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:674695": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Pre-transcription Events",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:75955": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Transcription Elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:112382": {
            "p-value": 0.00775,
            "description": "Formation of RNA Pol II elongation complex",
            "intersection": [
              "AFF4"
            ]
          }
        }
      };
      expect(res).to.deep.equal(result);
    });
  });
});