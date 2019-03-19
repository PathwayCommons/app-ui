const chai = require('chai');
const expect = chai.expect;

const { mockFetch } = require('../../../util');
const { getEntitySummary } = require('../../../../src/server/external-services/ncbi');
const EMPTY_RESPONSE_DATA_7157 = require('./empty-response-data.json');
const RESPONSE_DATA_7157 = require('./response-data-7157.json');
const SUMMARY_7157 = require('./entity-summary-7157.json');


describe ('Summary service: NCBI', function () {

  describe ('entityFetch', function () {

    it('Should create a correct EntitySummary from raw JSON', async () => {
      global.fetch = mockFetch( { json: () => RESPONSE_DATA_7157 } );
      const result =  await getEntitySummary( [ '7157' ] );
      expect( result ).to.deep.equal( SUMMARY_7157 );
    });

    it('Should return an empty object with no input', async () => {
      global.fetch = mockFetch( { json: () => EMPTY_RESPONSE_DATA_7157 } );
      const result =  await getEntitySummary( [ '0000' ] );
      expect( result ).to.deep.equal( [] );
    });

  });

});