const chai = require('chai');
const expect = chai.expect;
const { getEntitySummary } = require('../../../../src/server/external-services/ncbi');
const config = require('../../../../src/config');

const NCBI_GENE_ESUMMARY_7157 = require('./ncbi-gene-esummary-7157.json');
const SUMMARY_7157 = require('./summary-7157.json');

const mockJSONFetch = () => {
    return new Promise( resolve => {
      resolve({
        ok: true,
        json: () => NCBI_GENE_ESUMMARY_7157
      });
    });
  };


describe ('External service: NCBI', function () {
  describe ('entityFetch', function () {

    before(function(){
      global.fetch = mockJSONFetch;
    });

    it('Should be true', async () => {
      const result =  await getEntitySummary( ['7157'] );
      expect( result ).to.deep.equal( SUMMARY_7157 );
    });

  });
});