const chai = require('chai');
const expect = chai.expect;
const { getPathwayJson } = require('../../../src/server/routes/pathways/generate-pathway-json');


const URI_TEST_EXPECTED_RESULT = require('./uri.output.json');

describe('pathways network generation', function(){
  it('should return a json representation of a pathway given a uri', async () => {
    let uri = 'http://identifiers.org/reactome/R-HSA-73933';
    let result = await getPathwayJson( uri );


    expect( result ).to.deep.equal( URI_TEST_EXPECTED_RESULT );
  });
});
