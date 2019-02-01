const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { fillInBiopaxMetadata } = require('../../../src/server/routes/pathways/generate-pathway-json/biopax-metadata');
const sampleCyjsonData = require('./sample-cyjson-data');
const sampleMetadataOut = require('./sample-cyjson-out.json');
const { mockFetch } = require('../../util');

describe('Pathways network generation', function(){

  it('Should return correct metadata from getBiopaxMetadata', async () => {
    const mockResponse =  {
      values: [
        {
          "db": "name",
          "id": "id",
          "uri": "http://identifiers.org/name/id",
          "dbOk": true,
          "idOk": true,
          "preferredDb": "name",
          "namespace": "namespace"
        }
      ]
    };

    global.fetch = mockFetch( { json: () => mockResponse } );
    let sampleBiopaxData = fs.readFileSync(path.resolve(__dirname, './sample-biopax-data.txt'), 'utf-8');
    let result = await fillInBiopaxMetadata( sampleCyjsonData, sampleBiopaxData );
    expect( result ).to.deep.equal( sampleMetadataOut );
  });
});
