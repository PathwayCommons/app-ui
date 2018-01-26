const chai = require('chai');
const validate = require('../src/server/validate/validate.js');
const expect = chai.expect;

// check if tokens are in HGNC dataset

describe('validate tokens', function () {
  it('valid tokens', function () {
    expect(validate('AFF4')).to.deep.equal(true);
    expect(validate('TCF20')).to.deep.equal(true);
    expect(validate('CBX7')).to.deep.equal(true);
    expect(validate('TRIM24')).to.deep.equal(true);
    expect(validate('KDM3A')).to.deep.equal(true);
    expect(validate('MTA2')).to.deep.equal(true);
    expect(validate('SETD2')).to.deep.equal(true);
    expect(validate('MBD1')).to.deep.equal(true);
    expect(validate('UBR7')).to.deep.equal(true);
    expect(validate('ASH1L')).to.deep.equal(true);
  });

  it('invalid tokens', function() {
    expect(validate('YY50')).to.deep.equal(false);
    expect(validate('AA88')).to.deep.equal(false);
    expect(validate('98I')).to.deep.equal(false);
    expect(validate('I@I')).to.deep.equal(false);
    expect(validate('DPY3')).to.deep.equal(false);
    expect(validate('PY16H')).to.deep.equal(false);
    expect(validate('OLR2')).to.deep.equal(false);
    expect(validate('ARIH4B')).to.deep.equal(false);
    expect(validate('ARI*H4B')).to.deep.equal(false);
    expect(validate('A;')).to.deep.equal(false);
  })
});