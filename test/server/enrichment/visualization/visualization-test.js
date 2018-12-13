const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { mockFetch } = require('../../../util');
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');
const ENRICHMENT_NETWORK_JSON = require('./enrichment-network-json.json');

//generateGraphInfo( pathways, similarityCutoff, jaccardOverlapWeight);

describe('Test generateGraphInfo - Enrichment Vizualization Service', function () {
  it('parameters: all valid', async () => {
    global.fetch = mockFetch( { text: () => 'http://identifiers.org/name/id' } );
    const res = await generateEnrichmentNetworkJson([
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
    ], 0.3, 0.55 );
    expect( res ).to.deep.equal( ENRICHMENT_NETWORK_JSON );
  });

  it('parameters: invalid similarityCutoff', () => {
    const result = generateEnrichmentNetworkJson({ "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, 3.55 );
    return result.should.be.rejectedWith(Error);
  });

  it('parameters: invalid jaccardOverlapWeight', function () {
    const result =  generateEnrichmentNetworkJson({ "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, .55, 75 );
    return result.should.be.rejectedWith(Error);
  });

});