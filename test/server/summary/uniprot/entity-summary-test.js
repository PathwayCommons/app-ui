const chai = require('chai');
const expect = chai.expect;

const { mockFetch } = require('../../../util');
const { getEntitySummary } = require('../../../../src/server/external-services/uniprot');
const EMPTY_RESPONSE_DATA_Q99988 = require('./empty-response-data.json');
const RESPONSE_DATA_Q99988 = require('./response-data-Q99988.json');
const SUMMARY_Q99988 = require('./entity-summary-Q99988.json');


describe ('External service: UniProt', function () {

  describe ('entityFetch', function () {

    it('Should create a correct EntitySummary from raw JSON', async () => {
      global.fetch = mockFetch( { json: () => RESPONSE_DATA_Q99988 } );
      const result =  await getEntitySummary( [ 'Q99988' ] );
      expect( result ).to.deep.equal( SUMMARY_Q99988 );
    });

    it('Should return an empty object with no input', async () => {
      global.fetch = mockFetch( { json: () => EMPTY_RESPONSE_DATA_Q99988 } );
      const result =  await getEntitySummary( [ 'TTTT' ] );
      expect( result ).to.deep.equal( {} );
    });

  });

});