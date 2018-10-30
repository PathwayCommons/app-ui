const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { getBiopaxMetadata } = require('../../../src/server/routes/pathways/generate-pathway-json/biopax-metadata');
const sampleCyjsonData = require('./sample-cyjson-data');
const sampleMetadataOut = require('./sample-metadata-out.json');

describe('Pathways network generation', function(){
  beforeEach(function() {
    global.fetch = () => {
      return new Promise( resolve => {
        resolve({
          ok: true,
          Id: '123',
          text: () => 'http://identifiers.org/mockdb/mockid'
        });
      });
    };
  });

  it('Should return correct metadata from getBiopaxMetadata', async () => {
    let sampleBiopaxData = fs.readFileSync(path.resolve(__dirname, './sample-biopax-data.txt'), 'utf-8');

    let result = await getBiopaxMetadata( sampleCyjsonData.nodes, sampleBiopaxData );
    expect( result ).to.deep.equal( sampleMetadataOut );
  });
});
