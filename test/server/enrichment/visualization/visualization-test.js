const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { mockFetch } = require('../../../util');
const { handleTokens } = require('../../../../src/server/routes/enrichment/visualization/pathway-table');
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');

describe('Enrichment visualization', () =>  {
  let
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

  pathwayTokens1 = ['GO:0006354','DNA-templated transcription, elongation','POLR2J','PAF1','ELOA','ZMYND11','MNAT1','POLR2B','CTDP1','CDK13','ELP1','AFF4','THOC1','CCNT2','CCNK','SUPT16H','POLR2E','POLR2F','SOX10','THOC5','HTATSF1','POLR2C','ELOB','ERCC2','POLR2I','ELL','EZH2','RECQL5','SUPT6H','ELP4','GTF2H1','GTF2H3','RNF8','NCBP2','ELL2','ENY2','TSFM','GTF2F1','PCID2','ELL3','CCNT1','EAPP','ELOF1','MLLT1','ADRM1','ELP3','CDK7','CDC73','CCNH','ELP2','CDK9','NCBP1','RTF1','WDR61','BRD4','POLR2D','EAF1','EAF2','GTF2H2','POLR2K','SSRP1','POU4F1','HNRNPU','ELOC','CCAR2','ZNF326','ERCC3','IWS1','POLR2H','PBRM1','RNF168','SHH','LEO1','CDK12','POLR2G','TCEA2','MLLT3','TEFM','POLR2L','POLR2A','SETD2','ELOA3','NELFA','TCEA1','GTF2F2','NELFB','SUPT5H','DDX39B','LDB1','CTR9','NELFE','HMGN1','ELOA2','SUPT4H1','GTF2H4','ERCC6','BTBD18','GTF2H5'],
  pathwayTokens2 = ['GO:0006368','transcription elongation from RNA polymerase II promoter','POLR2J','PAF1','ELOA','ZMYND11','MNAT1','POLR2B','CTDP1','CDK13','ELP1','AFF4','CCNT2','CCNK','SUPT16H','POLR2E','POLR2F','SOX10','POLR2C','ELOB','ERCC2','POLR2I','ELL','EZH2','RECQL5','SUPT6H','ELP4','GTF2H1','GTF2H3','RNF8','NCBP2','ELL2','ENY2','GTF2F1','PCID2','ELL3','CCNT1','EAPP','ELOF1','MLLT1','ADRM1','ELP3','CDK7','CDC73','CCNH','ELP2','CDK9','NCBP1','RTF1','WDR61','BRD4','POLR2D','EAF1','EAF2','GTF2H2','POLR2K','SSRP1','HNRNPU','ELOC','ERCC3','IWS1','POLR2H','PBRM1','RNF168','SHH','LEO1','CDK12','POLR2G','MLLT3','POLR2L','POLR2A','SETD2','ELOA3','NELFA','TCEA1','GTF2F2','NELFB','SUPT5H','CTR9','NELFE','ELOA2','SUPT4H1','GTF2H4','BTBD18','GTF2H5'],
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
  });

  after( () => {
    global.fetch = require('../../../../src/util');
  });

  describe('Parsing tokens from a GMT file', function () {
    let processedTokens;

    before( () => {
      processedTokens = handleTokens( pathwayTokens1 );
    });

    it('Should return a result', () => {
      expect( processedTokens ).to.exist;
    });

    it('Should have the correct attributes', () => {
      expect( processedTokens ).to.have.property('id');
      expect( processedTokens ).to.have.property('name');
      expect( processedTokens ).to.have.property('geneSet');
      expect( processedTokens.geneSet ).to.not.have.lengthOf( 0 );
    });

  }); // Format pathway info table


  describe('Generating network JSON', () => {
    const pathwayInfoTable = new Map();

    before( () => {
      const processedTokens1 = handleTokens( pathwayTokens1 );
      const processedTokens2 = handleTokens( pathwayTokens2 );
      pathwayInfoTable.set(processedTokens1.id, processedTokens1);
      pathwayInfoTable.set(processedTokens2.id, processedTokens2);
    });

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