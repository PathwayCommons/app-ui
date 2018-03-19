const chai = require('chai');
const expect = chai.expect;
const {generateCys} = require('../../../server/enrichment-map/emap');


describe('test generateCys', function() {
  it('it should return an object', function() {
    return (generateCys(['GO:0043525', 'GO:0043523'])).then(function(res) {
      const result = {"unrecognized":[],"duplicate":[],"graph":{"node":["GO:0043525","GO:0043523"],"edge":[{"id":"GO:0043525_GO:0043523","source":"GO:0043525","target":"GO:0043523","similarity":0.6294416243654822,"intersection":["FIS1","HDAC4","BCL2L11","ATF2","FOXO3","BBC3","PRNP","CDK5R1","BAX","TP53","CASP9","CDK5","MAP3K11","CASP3","CDC34","EPHA7","JUN","CASP2","TGFB2","DDIT3","ATF4","NQO2","PCSK9","GRIK2","NF1","GRIK5","NQO1","CDC42","FBXW7","RAPSN","PRKN","TFAP2A","FASLG","AIFM1","UBE2M","MAP2K4","MYB","MYBL2","ATM","PAK3","PITX3","CTNNB1","CCL3","ASCL1","CTSZ","PIN1","GSK3A","ITGA1","SRPK2","TFAP2B","MCL1"]}]}};
      expect(res).to.deep.equal(result);
    });
  });
});