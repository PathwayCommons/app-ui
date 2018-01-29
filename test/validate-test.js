const chai = require('chai');
const func = require('../src/server/validate/validate');
const validate = func.validate;
const proceed = func.proceed;
const expect = chai.expect;


describe('proceed', function () {
  it('returns true', function () {
    const data1 = validate('ELP4');
    const data2 = validate('\nELP4\n\n\nPAF1\n');
    const data3 = validate('\n\n\nHLTF\r\nTDG\n');
    const data4 = validate('ELP4\n\n\nPAF1\n\r\nMLLT6\nSCML2\r\n\n');
    const data5 = validate('\nELP4\n\n\nPAF1\nMLLT6\r\nHLTF\n\n\n');
    expect(proceed(data1)).to.deep.equal(true);
    expect(proceed(data2)).to.deep.equal(true);
    expect(proceed(data3)).to.deep.equal(true);
    expect(proceed(data4)).to.deep.equal(true);
    expect(proceed(data5)).to.deep.equal(true);
  });

  it('returns false', function() {
    const data1 = validate('ELP4\nELP4');
    const data2 = validate('\nELP4\n\nTDG\nPAF1\nELP4');
    const data3 = validate('ELP4\nYY50\n\nAFF4');
    const data4 = validate('\nELP4\n\nHLTF\nPAF1\nMLLT6\r\nHLTF\n\n\n');
    const data5 = validate('\r\n@II\nELP4\n\n\nPAF1\nMLLT6\r\nHLTF\n\n\n');
    const data6 = validate('\nELP4\n\nHLTF\r\nMLLT6\nPAF1\nMLLT6\r\nHLTF\n\n\n');
    expect(proceed(data1)).to.deep.equal(false);
    expect(proceed(data2)).to.deep.equal(false);
    expect(proceed(data3)).to.deep.equal(false);
    expect(proceed(data4)).to.deep.equal(false);
    expect(proceed(data5)).to.deep.equal(false);
    expect(proceed(data6)).to.deep.equal(false);
  });
});

