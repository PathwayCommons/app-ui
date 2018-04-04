const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const { enrichment } = require('../../../../src/server/enrichment-map/enrichment');


// object keys are unordered
// reponses from gProfiler for 'tGroup', 'tDepth' and 'tName' are different at times
// ignore 'tGroup', 'tDepth', trim inconsistent whitespaces in 'tName'
const gProfilerResEquality = (obj1, obj2) => {
  return _.isEqualWith(obj1, obj2, (val1, val2, key) => {
    if (key === 'tGroup' || key === 'tDepth') { return true; }
    if (key === 'tName') { return val1.trim() === val2.trim(); }
  });
};


describe('test enrichment', function () {
  this.timeout(500000);
  it('it should return an object', function () {
    return (enrichment('AFF4')).then(function (res) {
      const result = {
        "options": {
          "orderedQuery": 0,
          "userThr": 0.05,
          "minSetSize": 5,
          "maxSetSize": 200,
          "thresholdAlgo": "fdr",
          "custbg": []
        },
        "pathwayInfo": {
          "GO:0006354": {
            "pValue": 0.0087,
            "t": 124,
            "q": 1,
            "qAndT": 1,
            "qAndTOverQ": 1,
            "qAndTOverT": 0.008,
            "tType": "BP",
            "tGroup": 1,
            "tName": "DNA-templated transcription, elongation",
            "tDepth": 1,
            "qAndTList": [
              "AFF4"
            ]
          },
          "GO:0006368": {
            "pValue": 0.0087,
            "t": 100,
            "q": 1,
            "qAndT": 1,
            "qAndTOverQ": 1,
            "qAndTOverT": 0.01,
            "tType": "BP",
            "tGroup": 1,
            "tName": "transcription elongation from RNA polymerase II promoter",
            "tDepth": 2,
            "qAndTList": [
              "AFF4"
            ]
          },
          "REAC:674695": {
            "pValue": 0.00775,
            "t": 83,
            "q": 1,
            "qAndT": 1,
            "qAndTOverQ": 1,
            "qAndTOverT": 0.012,
            "tType": "rea",
            "tGroup": 3,
            "tName": "RNA Polymerase II Pre-transcription Events",
            "tDepth": 1,
            "qAndTList": [
              "AFF4"
            ]
          },
          "REAC:75955": {
            "pValue": 0.00775,
            "t": 61,
            "q": 1,
            "qAndT": 1,
            "qAndTOverQ": 1,
            "qAndTOverT": 0.016,
            "tType": "rea",
            "tGroup": 2,
            "tName": "RNA Polymerase II Transcription Elongation",
            "tDepth": 1,
            "qAndTList": [
              "AFF4"
            ]
          },
          "REAC:112382": {
            "pValue": 0.00775,
            "t": 61,
            "q": 1,
            "qAndT": 1,
            "qAndTOverQ": 1,
            "qAndTOverT": 0.016,
            "tType": "rea",
            "tGroup": 2,
            "tName": "Formation of RNA Pol II elongation complex",
            "tDepth": 2,
            "qAndTList": [
              "AFF4"
            ]
          }
        }
      };
      expect(gProfilerResEquality(result, res)).to.equal(true);
    });
  });
});