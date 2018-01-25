const chai = require('chai');

const geneListValidator = require('../src/server/gene-query');
const expect = chai.expect;
const assert = chai.assert;



describe('Gene query', function(){

  it('single human gene symbol, returns a good input response', function(){
    const goodInput = [['AFF4'], ['NAP1L3'], ['BRPF1'], ['TCF20']];

    const result = geneListValidator(goodInput);
    expect(result).to.equal({msg: "input is good"});
  });


  it('single invalid gene symbol, returns a bad input response', function(){
    const badInput = [['YY50'], ['YY51'], ['YY52'], ['YY53']];

    const result = geneListValidator(badInput);
    expect(result).to.equal({msg: "input is bad"});
  });
});
