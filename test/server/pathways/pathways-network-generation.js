const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { fillInBiopaxMetadata } = require('../../../src/server/routes/pathways/generate-pathway-json/biopax-metadata');
const sampleCyjsonData = require('./sample-cyjson-data');
const sampleMetadataOut = require('./sample-cyjson-out.json');

const fakeMiriamService = new Map([
  ['chebi', 'chebi'],
  ['molecular interactions ontology', 'psimi'],
  ['mi', 'psimi'],
  ['chebi', 'chebi'],
  ['reactome', 'reactome'],
  ['pubmed', 'pubmed'],
  ['uniprot knowledgebase', 'uniprot'],
  ['hgnc symbol', 'hgnc.symbol'],
  ['gene ontology', 'go'],
  ['ensembl', 'ensembl'],
  ['protein modification ontology', 'mod']
]);

function mockFetch(){
  const urlParts = arguments[0].split('/');
  const name = urlParts[6];
  const localId = urlParts[7];
  return new Promise( resolve => {
    resolve({
      ok: true,
      text: () => fakeMiriamService.has(name) ? `http://identifiers.org/${fakeMiriamService.get(name)}/${localId}`: ''
    });
  });
}

global.fetch = mockFetch;

describe('Pathways network generation', function(){
  it('Should return correct metadata from getBiopaxMetadata', async () => {
    let sampleBiopaxData = fs.readFileSync(path.resolve(__dirname, './sample-biopax-data.txt'), 'utf-8');

    let result = await fillInBiopaxMetadata( sampleCyjsonData, sampleBiopaxData );

    expect( result ).to.deep.equal( sampleMetadataOut );
  });
});
