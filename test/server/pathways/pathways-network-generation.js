const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { fillInBiopaxMetadata } = require('../../../src/server/routes/pathways/generate-pathway-json/biopax-metadata');
const sampleCyjsonData = require('./sample-cyjson-data');
const sampleMetadataOut = require('./sample-metadata-out.json');

global.fetch = () => {
  return new Promise( resolve => {
    resolve({
      ok: true,
      text: () => 'http://identifiers.org/namespace/localId'
    });
  });
};

describe('Pathways network generation', function(){
  it('Should return correct metadata from getBiopaxMetadata', async () => {
    let sampleBiopaxData = fs.readFileSync(path.resolve(__dirname, './sample-biopax-data.txt'), 'utf-8');

    let result = await fillInBiopaxMetadata( sampleCyjsonData, sampleBiopaxData );

    // TODO
  });
});
