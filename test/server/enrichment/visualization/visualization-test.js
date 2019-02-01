const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { mockFetch } = require('../../../util');
// const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');
const { getPathwayInfoTable } = require('../../../../src/server/routes/enrichment/visualization/pathway-table');

const ENRICHMENT_NETWORK_JSON = require('./enrichment-network-json.json');

//generateGraphInfo( pathways, similarityCutoff, jaccardOverlapWeight);

describe('Test generateGraphInfo - Enrichment Vizualization Service', function () {
  it('parameters: all valid', async () => {
    const table = await getPathwayInfoTable();
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
    const res = await generateEnrichmentNetworkJson(table, [
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

  it('parameters: invalid similarityCutoff', async function(){
    const table = await getPathwayInfoTable();

    const result = generateEnrichmentNetworkJson(table, { "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, 3.55 );

    return result.should.be.rejectedWith(Error);
  });

  it('parameters: invalid jaccardOverlapWeight', async function () {
    const table = await getPathwayInfoTable();

    const result =  generateEnrichmentNetworkJson(table, { "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, .55, 75 );

    return result.should.be.rejectedWith(Error);
  });

});