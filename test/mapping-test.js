// mapping HGNC symbol to HGNC ID
const chai = require('chai');
const expect = chai.expect;
const mapping = require('../src/server/mapping/mapping.js');

describe('mapping HGNC symbol to HGNC ID', function() {
  it('it should return a HGNC ID', function() {
    expect(mapping('AFF4')).to.deep.equal('HGNC:17869');
    expect(mapping('HLTF')).to.deep.equal('HGNC:11099');
    expect(mapping('HCFC1')).to.deep.equal('HGNC:4839');
    expect(mapping('NCOA1')).to.deep.equal('HGNC:7668');
    expect(mapping('MTA2')).to.deep.equal('HGNC:7411');
    expect(mapping('MBD1')).to.deep.equal('HGNC:6916');
    expect(mapping('JMJD6')).to.deep.equal('HGNC:19355');
    expect(mapping('MTA3')).to.deep.equal('HGNC:23784');
    expect(mapping('GTF3C4')).to.deep.equal('HGNC:4667');
    expect(mapping('BRD4')).to.deep.equal('HGNC:13575');
    expect(mapping('ASH1L')).to.deep.equal('HGNC:19088');
  });

  it('it should return null', function() {
    expect(mapping('YY50')).to.deep.equal(null);
    expect(mapping('L&L')).to.deep.equal(null);
    expect(mapping('99I')).to.deep.equal(null);
    expect(mapping('@RI')).to.deep.equal(null);
    expect(mapping('AFF45')).to.deep.equal(null);
  });
});
