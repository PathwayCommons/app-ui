const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const nodeFetch = require('node-fetch');
const pc = require('../../../src/server/external-services/pathway-commons');
const { biopaxText2ElementMap, extractBiopaxMetadata } = require('../../../src/server/routes/pathways/generate-pathway-json/biopax-metadata');

describe('Pathways route', function(){
  let xref2UriStub;
  const MAP_ELEMENT_KEY = "pc2:Protein_c1f5c065e6bc72127ca56ee0bf005494",
    SAMPLE_BIOPAX_JSON = {
      "@id": "pc2:Protein_c1f5c065e6bc72127ca56ee0bf005494",
      "@type": "bp:Protein",
      "cellularLocation": "pc2:CellularLocationVocabulary_d7b7576a6ce6c6961a2de2e8c0608786",
      "comment": [
        "Reactome DB_ID: 6803382"
      ],
      "dataSource": "pc2:reactome",
      "displayName": "PCBP4",
      "entityReference": "http://bioregistry.io/uniprot:P57723",
      "feature": "pc2:FragmentFeature_fb7974c4f86ce5554fb54db50313c971",
      "name": [
        "Alpha-CP4",
        "Poly(rC)-binding protein 4",
        "MCG10"
      ],
      "xref": "pc2:UnificationXref_reactome_R-HSA-6803382",
      "xrefLinks": {
        "somenamespace": [
          "someuri",
          "someuri",
          "someuri"
        ]
      },
      "entRefEl": {
        "@id": "http://bioregistry.io/uniprot:P57723",
        "@type": "bp:ProteinReference",
        "comment": [
          "FUNCTION: somefunction",
          "PCBP4_HUMAN Reviewed; 403 AA."
        ],
        "displayName": "PCBP4_HUMAN",
        "name": [
          "PCBP4",
          "Alpha-CP4"
        ],
        "organism": "http://bioregistry.io/ncbitaxon:9606",
        "standardName": "Poly(rC)-binding protein 4",
        "xref": [
          "pc2:RelationshipXref_hgnc_symbol_PCBP4_identity",
          "pc2:UnificationXref_uniprot_knowledgebase_P57723"
        ],
        "xrefLinks": {
          "somenamespace": [
            "someuri",
            "someuri"
          ]
        }
      }
    };

  before( () => {
    global.fetch = nodeFetch;
    xref2UriStub = sinon
      .stub( pc, 'xref2Uri' )
      .resolves( { uri: 'someuri', namespace: 'somenamespace' } );
  });

  after( () => {
    xref2UriStub.restore();
  });

  describe('biopaxText2ElementMap', function(){
    let biopaxJson;

    before( () => {
      const str = fs.readFileSync( path.resolve( __dirname, './sample-biopax-data.json' ), 'utf-8');
      biopaxJson = JSON.parse( str );
    });

    it('Should call the xrefSuggested dependency', async () => {
      await biopaxText2ElementMap( biopaxJson, xref2UriStub );
      expect( xref2UriStub.called ).to.be.true;
    });

    it('Should return populated Map', async () => {
      const elementMap = await biopaxText2ElementMap( biopaxJson, xref2UriStub );
      expect( elementMap.size ).to.be.at.least(1);
    });

    it('Should return Map value with correct properties', async () => {
      const elementMap = await biopaxText2ElementMap( biopaxJson, xref2UriStub );
      const mapValue = elementMap.get( MAP_ELEMENT_KEY );
      expect( mapValue ).to.exist;
      expect( mapValue ).to.have.property('@id');
      expect( mapValue ).to.exist;
      expect( mapValue ).to.have.property('@type');
      expect( mapValue ).to.have.property('dataSource');
      expect( mapValue ).to.have.property('displayName');
      expect( mapValue ).to.have.property('entityReference');
      expect( mapValue ).to.have.property('name');
      expect( mapValue ).to.have.property('xref');
    });
  }); // biopaxText2ElementMap

  describe('extractBiopaxMetadata', function(){
    it('Should return object value with correct properties', () => {
      const metadata = extractBiopaxMetadata( SAMPLE_BIOPAX_JSON );
      expect( metadata ).to.exist;
      expect( metadata ).to.have.property('comments');
      expect( metadata ).to.have.property('synonyms');
      expect( metadata ).to.have.property('datasource');
      expect( metadata ).to.have.property('type');
      expect( metadata ).to.have.property('standardName');
      expect( metadata ).to.have.property('displayName');
      expect( metadata ).to.have.property('xrefLinks');
    });
  }); // extractBiopaxMetadata
});

