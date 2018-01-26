const chai = require('chai');
const tokenize = require('../src/server/tokenize.js');
const expect = chai.expect;

// test summary:
// single token
// two tokens separated by a newline
// two tokens separated by more than one newline
// multiple tokens, multiple newlines

describe('single token', function() {
  it ('it should return a single token', function() {
    const result = tokenize('AFF4');
    expect(result).to.deep.equal(['AFF4']);
  });
  it ('it should return a single token', function() {
    const result = tokenize('HLTF');
    expect(result).to.deep.equal(['HLTF']);
  });
  it ('it should return a single token', function() {
    const result = tokenize('TDG');
    expect(result).to.deep.equal(['TDG']);
  });
});

describe('two tokens separated by a newline', function() {
  it('it should return two tokens', function() {
    const result = tokenize('ELP4\nPAF1');
    expect(result).to.deep.equal(['ELP4', 'PAF1']);
  });
  it('it should return two tokens', function() {
    const result = tokenize('HLTF\r\nTDG');
    expect(result).to.deep.equal(['HLTF', 'TDG']);
  });
});

describe('two tokens separated by more than one newline', function() {
  it('it should return two tokens', function() {
    const result = tokenize('\nELP4\n\n\nPAF1\n');
    expect(result).to.deep.equal(['ELP4', 'PAF1']);
  });
  it('it should return two tokens', function() {
    const result = tokenize('\n\n\nHLTF\r\nTDG\n');
    expect(result).to.deep.equal(['HLTF', 'TDG']);
  });
});

describe('multiple tokens, multiple newlines', function() {
  it('it should return multiple tokens', function() {
    const result = tokenize('ELP4\n\n\nPAF1\n\r\nMLLT6\nSCML2\r\n\n');
    expect(result).to.deep.equal(['ELP4', 'PAF1', 'MLLT6', 'SCML2']);
  });
  it('it should return multiple tokens', function() {
    const result = tokenize('\nELP4\n\n\nPAF1\nMLLT6\r\nHLTF\n\n\n');
    expect(result).to.deep.equal(['ELP4', 'PAF1', 'MLLT6', 'HLTF']);
  });
});


