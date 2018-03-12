const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const {enrichment} = require('../../../../src/server/enrichment-map/enrichment');


// object keys are unordered
// t group changes
const objectEquality = (obj1, obj2) => {
  return _.isEqualWith(obj1, obj2, (val1, val2, key) => {
      if (key === "signf" || key === "pvalue" || key === "T" || key === "Q" || key === "Q&T" || key === "Q&T/Q" || key === "Q&T/T" || key === "t type" || key === "t name" || key === "t depth" || key === "Q&T list") {
        return val1.key === val2.key;
      }
      return true;
  });
};


describe('test enrichment', function() {
  this.timeout(500000);
  it('it should return an object', function() {
    return (enrichment('AFF4')).then(function(res) {
      const result = {
        'GO:0006354':
         { signf: '!',
           pvalue: '8.70e-03',
           T: '124',
           Q: '1',
           'Q&T': '1',
           'Q&T/Q': '1.000',
           'Q&T/T': '0.008',
           't type': 'BP',
           't group': '3',
           't name': '   DNA-templated transcription, elongation',
           't depth': '1',
           'Q&T list': 'AFF4' },
        'GO:0006368':
         { signf: '!',
           pvalue: '8.70e-03',
           T: '100',
           Q: '1',
           'Q&T': '1',
           'Q&T/Q': '1.000',
           'Q&T/T': '0.010',
           't type': 'BP',
           't group': '3',
           't name': '   transcription elongation from RNA polymerase II promoter',
           't depth': '1',
           'Q&T list': 'AFF4' },
        'REAC:75955':
         { signf: '!',
           pvalue: '7.75e-03',
           T: '61',
           Q: '1',
           'Q&T': '1',
           'Q&T/Q': '1.000',
           'Q&T/T': '0.016',
           't type': 'rea',
           't group': '5',
           't name': '   RNA Polymerase II Transcription Elongation',
           't depth': '1',
           'Q&T list': 'AFF4' },
        'REAC:112382':
         { signf: '!',
           pvalue: '7.75e-03',
           T: '61',
           Q: '1',
           'Q&T': '1',
           'Q&T/Q': '1.000',
           'Q&T/T': '0.016',
           't type': 'rea',
           't group': '5',
           't name': '    Formation of RNA Pol II elongation complex ',
           't depth': '2',
           'Q&T list': 'AFF4' },
        'REAC:674695':
         { signf: '!',
           pvalue: '7.75e-03',
           T: '83',
           Q: '1',
           'Q&T': '1',
           'Q&T/Q': '1.000',
           'Q&T/T': '0.012',
           't type': 'rea',
           't group': '2',
           't name': '   RNA Polymerase II Pre-transcription Events',
           't depth': '1',
           'Q&T list': 'AFF4' } };
        expect(objectEquality(result, res)).to.equal(true);
    });
  });
});