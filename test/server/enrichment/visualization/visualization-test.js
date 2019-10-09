const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { mockFetch } = require('../../../util');
const { formatPathwayInfoTable } = require('../../../../src/server/routes/enrichment/visualization/pathway-table');
const { GMT_SOURCE_FILENAME } = require('../../../../src/config');
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');

describe('Enrichment visualization', () =>  {
  let pathwayInfoTable, firstPathwayKey, firstPathway,
  mockResponse = {
    values: [	
      {	
        "db": "go",	
        "id": "id",	
        "uri": "http://identifiers.org/go/id",	
        "dbOk": true,	
        "idOk": true,	
        "preferredDb": "name",	
        "namespace": "namespace"	
      }	
    ]	
  },
  mockPathways = [
    {
      "id": "GO:0006354",
      "data": {
        "name": "DNA-templated transcription, elongation",
        "p_value": "1.29e-03",
        "intersection": [
          "PAF1",
          "ZMYND11",
          "POLR2B",
          "AFF4",
          "SUPT16H",
          "ELP4",
          "GTF2H1",
          "BRD4",
          "SSRP1",
          "SETD2"
        ]
      }
    },
    {
      "id": "GO:0006368",
      "data": {
        "name": "transcription elongation from RNA polymerase II promoter",
        "p_value": "1.29e-03",
        "intersection": [
          "PAF1",
          "ZMYND11",
          "POLR2B",
          "AFF4",
          "SUPT16H",
          "ELP4",
          "GTF2H1",
          "BRD4",
          "SSRP1",
          "SETD2"
        ]
      }
    }
  ];

  before( () => {
    global.fetch = mockFetch( { json: () => mockResponse } );
    const sampleGmtPathwayData = fs.readFileSync( path.resolve( __dirname, GMT_SOURCE_FILENAME ), { encoding: 'utf8' } );
    pathwayInfoTable = formatPathwayInfoTable( sampleGmtPathwayData );
    firstPathwayKey = pathwayInfoTable.keys().next(); 
    firstPathway = pathwayInfoTable.values().next();
  });

  after( () => {
    global.fetch = require('../../../../src/util');
  });

  describe('Format pathway info table', function () {
    
    it('Should return a result', () => {
      expect( pathwayInfoTable ).to.exist;
    });
  
    it('Should return at least one entry', () => {
      expect( firstPathwayKey.value ).to.exist;
      expect( firstPathway.value ).to.exist;
    });
  
    it('Should have the correct value', () => {
      expect( firstPathway.value['id'] ).to.equal( firstPathwayKey.value );
      expect( firstPathway.value ).to.have.property('name');
      expect( firstPathway.value ).to.have.property('geneSet');
      expect( firstPathway.value['geneSet'] ).to.not.have.lengthOf( 0 );
    });

  }); // Format pathway info table


  describe('Generating network JSON', () => {
    

    describe('Valid network JSON', () => {
      let result;

      before( async () => {
        result = await generateEnrichmentNetworkJson( pathwayInfoTable, mockPathways, 0.3, 0.55 );
      });

      it('Should return correct network', async () => {
        expect( result ).to.have.all.keys('unrecognized', 'graph');
        expect( result ).to.have.nested.property( 'graph.elements' );
      }); 
    
      describe('Nodes and edges', () => {
        let elements;
        before( () => {
          elements = _.get( result, ['graph', 'elements'] );
        });

        it('Should contain nodes and edges', () => {  
          expect( elements ).to.have.all.keys('nodes', 'edges');
        });

        describe('Nodes', () => {
          let nodes, first, data;
          before( () => {
            nodes = _.get( elements, ['nodes'] );
            first = _.head( nodes );
            data = _.get( first, ['data'] );
          });
  
          it('Should contain nodes and data', () => {  
            expect( first ).to.exist;
            expect( data ).to.exist;
          });

          it('Should have correct data keys', () => {  
            expect( data ).to.have.all.keys( 'id', 'name', 'geneSet', 'p_value', 'intersection', 'geneCount', 'uri', 'namespace' );
          });
        });

        describe('Edges', () => {
          let edges, first, data;
          before( () => {
            edges = _.get( elements, ['edges'] );
            first = _.head( edges );
            data = _.get( first, ['data'] );
          });
  
          it('Should contain edges and data', () => {  
            expect( first ).to.exist;
            expect( data ).to.exist;
          });

          it('Should have correct data keys', () => {  
            expect( data ).to.have.all.keys( 'id', 'source', 'target', 'intersection', 'similarity' );
          });
        });
      });
    });

    it('Should not accept an invalid similarityCutoff', async () => {
      const result = generateEnrichmentNetworkJson( pathwayInfoTable, mockPathways, 3.55 );
      expect( result ).to.be.rejectedWith( Error ); 
    });

    it('Should not accept an invalid jaccardOverlapWeight', async () => {
      const result = generateEnrichmentNetworkJson( pathwayInfoTable, mockPathways, 0.55, 75 );
      expect( result ).to.be.rejectedWith( Error );
    });

  });// Generating network JSON

})