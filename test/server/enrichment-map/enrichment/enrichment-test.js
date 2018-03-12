const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const { enrichment } = require('../../../../src/server/enrichment-map/enrichment');


// object keys are unordered
// reponses from gProfiler for 't group', 't depth' and 't name' are different at times
// ignore 't group', 't name', trim inconsistent whitespaces in 't name'
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
      const result = { 'GO:0006354':
      { signf: '!',
        pvalue: '8.70e-03',
        T: '124',
        Q: '1',
        tType: 'BP',
        tGroup: '5',
        tName: '   DNA-templated transcription, elongation',
        tDepth: '1',
        'Q&T': '1',
        'Q&T/Q': '1.000',
        'Q&T/T': '0.008',
        'Q&TList': 'AFF4' },
     'GO:0006368':
      { signf: '!',
        pvalue: '8.70e-03',
        T: '100',
        Q: '1',
        tType: 'BP',
        tGroup: '5',
        tName: '    transcription elongation from RNA polymerase II promoter',
        tDepth: '2',
        'Q&T': '1',
        'Q&T/Q': '1.000',
        'Q&T/T': '0.010',
        'Q&TList': 'AFF4' },
     'REAC:75955':
      { signf: '!',
        pvalue: '7.75e-03',
        T: '61',
        Q: '1',
        tType: 'rea',
        tGroup: '2',
        tName: '   RNA Polymerase II Transcription Elongation',
        tDepth: '1',
        'Q&T': '1',
        'Q&T/Q': '1.000',
        'Q&T/T': '0.016',
        'Q&TList': 'AFF4' },
     'REAC:112382':
      { signf: '!',
        pvalue: '7.75e-03',
        T: '61',
        Q: '1',
        tType: 'rea',
        tGroup: '2',
        tName: '    Formation of RNA Pol II elongation complex ',
        tDepth: '2',
        'Q&T': '1',
        'Q&T/Q': '1.000',
        'Q&T/T': '0.016',
        'Q&TList': 'AFF4' },
     'REAC:674695':
      { signf: '!',
        pvalue: '7.75e-03',
        T: '83',
        Q: '1',
        tType: 'rea',
        tGroup: '6',
        tName: '   RNA Polymerase II Pre-transcription Events',
        tDepth: '1',
        'Q&T': '1',
        'Q&T/Q': '1.000',
        'Q&T/T': '0.012',
        'Q&TList': 'AFF4' } };
      expect(gProfilerResEquality(result, res)).to.equal(true);
    });
  });
});