const chai = require('chai');
const expect = chai.expect;

const { mockFetch } = require('../../../util');
const { getEntitySummary } = require('../../../../src/server/external-services/hgnc');
const EMPTY_RESPONSE_DATA_TP53 = require('./empty-response-data.json');
const RESPONSE_DATA_TP53 = require('./response-data-TP53.json');
const SUMMARY_TP53 = require('./entity-summary-TP53.json');


describe ('Summary service: HGNC', function () {

  describe ('entityFetch', function () {

    it('Should create a correct EntitySummary from raw JSON', async () => {
      global.fetch = mockFetch( { json: () => RESPONSE_DATA_TP53 } );
      const result =  await getEntitySummary( [ 'TP53' ] );
      expect( result ).to.deep.equal( SUMMARY_TP53 );
    });

    it('Should return an empty object with no input', async () => {
      global.fetch = mockFetch( { json: () => EMPTY_RESPONSE_DATA_TP53 } );
      const result =  await getEntitySummary( [ 'TTTT' ] );
      expect( result ).to.deep.equal( [] );
    });

  });

});