const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const { enrichment } = require('../../../../src/server/enrichment/analysis');


describe('test enrichment', function () {
  this.timeout(500000);
  it('only input gene', function () {
    return (enrichment(['AFF4'])).then(
      //resolved
      function (res) {
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
    },
    //rejected
    rej => {
    console.log("rejected");
    }
    );
  });

  it('all valid parameters', function () {
    return (enrichment(['AFF4'], {minSetSize: 3, maxSetSize:400, backgroundGenes: []})).then(
      //resolved
      res=> {
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
    },
    //rejected
    rej => {
    console.log("rejected")
    }
    );
  });

  it('INVALID parameters', function () {
    return (enrichment(['AFF4'], {minSetSize: 3, maxSetSize:"not a number", backgroundGenes: []})).then(
      //resolved
      res => {
      console.log("resolved");
      },
      //rejected
      rej => {
      expect(true);
      }
    );
  });

});