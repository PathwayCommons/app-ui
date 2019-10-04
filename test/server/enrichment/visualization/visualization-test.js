const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { formatPathwayInfoTable } = require('../../../../src/server/routes/enrichment/visualization/pathway-table');
const { GMT_SOURCE_FILENAME } = require('../../../../src/config');
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');

describe('Enrichment visualization', () =>  {
  let pathwayInfoTable, firstPathwayKey, firstPathway,
  mockPathways = [{ "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}];

  before( () => {
    const sampleGmtPathwayData = fs.readFileSync( path.resolve( __dirname, GMT_SOURCE_FILENAME ), { encoding: 'utf8' } );
    pathwayInfoTable = formatPathwayInfoTable( sampleGmtPathwayData );
    firstPathwayKey = pathwayInfoTable.keys().next(); 
    firstPathway = pathwayInfoTable.values().next();
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
        console.log(result);
      });

      it('Should return correct network', () => {  
        expect( result ).to.have.all.keys('unrecognized', 'graph');
        expect( result ).to.have.nested.property( 'graph.elements' );
      }); 
    
      describe('Nodes and edges', () => {
        let elements;
        before( async () => {
          elements = _.get( result, ['graph', 'elements'] );
        });

        it('Should contain nodes and edges', () => {  
          expect( elements ).to.have.all.keys('nodes', 'edges');
        });
      });
    });

    it('Should not accept an invalid similarityCutoff', () => {
      const result = generateEnrichmentNetworkJson( pathwayInfoTable, mockPathways, 3.55 );
      return result.should.be.rejectedWith( Error ); 
    });

    it('Should not accept an invalid jaccardOverlapWeight', () => {
      const result = generateEnrichmentNetworkJson( pathwayInfoTable, mockPathways, 0.55, 75 );
      return result.should.be.rejectedWith( Error );
    });


  });// Generating network JSON

})