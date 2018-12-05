const chai = require('chai');
const expect = chai.expect;
const { generateEnrichmentNetworkJson } = require('../../../../src/server/routes/enrichment/visualization');

//generateGraphInfo( pathways, similarityCutoff, jaccardOverlapWeight);

describe('Test generateGraphInfo - Enrichment Vizualization Service', function () {
  it('parameters: all valid', function () {
    const res = generateEnrichmentNetworkJson({"GO:0006354": { "p_value": .1 }, "GO:0006368": { "intersection": ["AFF4"] }}, 0.3, 0.55 );
    const result = {
      "unrecognized": [],
      "graph": {
        "elements": {
          "nodes": [
            {
              "data": {
                "id": "GO:0006354",
                "intersection": [],
                "geneCount": 97,
                "geneSet": [
                  "THOC5",
                  "DDX39B",
                  "CDK9",
                  "POLR2H",
                  "SUPT16H",
                  "POLR2G",
                  "ADRM1",
                  "CDK7",
                  "ERCC2",
                  "NCBP1",
                  "IWS1",
                  "LDB1",
                  "THOC1",
                  "SUPT4H1",
                  "GTF2F1",
                  "TSFM",
                  "ELP3",
                  "HTATSF1",
                  "POLR2B",
                  "GTF2H2",
                  "ELOA3B",
                  "LEO1",
                  "POU4F1",
                  "RTF1",
                  "EAF1",
                  "MLLT3",
                  "NELFA",
                  "HNRNPU",
                  "POLR2J",
                  "ELL3",
                  "RNF168",
                  "CCNT1",
                  "ELOB",
                  "SOX10",
                  "POLR2C",
                  "ELOA3D",
                  "CDK13",
                  "NELFB",
                  "EAF2",
                  "GTF2H3",
                  "ERCC3",
                  "AFF4",
                  "SUPT6H",
                  "PCID2",
                  "POLR2E",
                  "TCEA2",
                  "EZH2",
                  "ELOF1",
                  "AXIN1",
                  "POLR2D",
                  "ELP2",
                  "ELP4",
                  "ZNF326",
                  "EAPP",
                  "POLR2K",
                  "GTF2H4",
                  "ELOA2",
                  "PAF1",
                  "BRD4",
                  "POLR2F",
                  "NELFE",
                  "ELOA",
                  "ELOC",
                  "ERCC6",
                  "ELL",
                  "ELOA3",
                  "MLLT1",
                  "CTR9",
                  "SHH",
                  "ZMYND11",
                  "CCAR2",
                  "SETD2",
                  "SSRP1",
                  "ENY2",
                  "TCEA1",
                  "RECQL5",
                  "CCNH",
                  "GTF2H1",
                  "CTDP1",
                  "POLR2A",
                  "CDK12",
                  "MNAT1",
                  "ELP1",
                  "CCNK",
                  "HMGN1",
                  "BTBD18",
                  "WDR61",
                  "POLR2I",
                  "RNF8",
                  "CCNT2",
                  "CDC73",
                  "POLR2L",
                  "NCBP2",
                  "GTF2F2",
                  "SUPT5H",
                  "ELL2",
                  "GTF2H5"
                ],
                "name": "DNA-templated transcription, elongation"
              }
            },
            {
              "data": {
                "id": "GO:0006368",
                "intersection": [
                  "AFF4"
                ],
                "geneCount": 85,
                "geneSet": [
                  "POLR2G",
                  "CDK9",
                  "POLR2H",
                  "SUPT16H",
                  "GTF2F1",
                  "ELP3",
                  "SUPT4H1",
                  "NCBP1",
                  "IWS1",
                  "ERCC2",
                  "ADRM1",
                  "CDK7",
                  "POLR2C",
                  "CDK13",
                  "NELFB",
                  "ELOA3D",
                  "ELOB",
                  "SOX10",
                  "POLR2J",
                  "ELL3",
                  "CCNT1",
                  "RNF168",
                  "NELFA",
                  "HNRNPU",
                  "EAF1",
                  "RTF1",
                  "MLLT3",
                  "ELOA3B",
                  "LEO1",
                  "GTF2H2",
                  "POLR2B",
                  "POLR2E",
                  "PCID2",
                  "AFF4",
                  "SUPT6H",
                  "GTF2H3",
                  "ERCC3",
                  "EAF2",
                  "NELFE",
                  "POLR2F",
                  "BRD4",
                  "ELOA2",
                  "PAF1",
                  "GTF2H4",
                  "EAPP",
                  "POLR2K",
                  "ELP4",
                  "EZH2",
                  "ELOF1",
                  "POLR2D",
                  "AXIN1",
                  "ELP2",
                  "ZMYND11",
                  "MLLT1",
                  "SHH",
                  "CTR9",
                  "ELL",
                  "ELOA3",
                  "ELOC",
                  "ELOA",
                  "BTBD18",
                  "CCNK",
                  "ELP1",
                  "MNAT1",
                  "POLR2A",
                  "CDK12",
                  "GTF2H1",
                  "CTDP1",
                  "RECQL5",
                  "CCNH",
                  "SSRP1",
                  "ENY2",
                  "TCEA1",
                  "SETD2",
                  "GTF2H5",
                  "ELL2",
                  "SUPT5H",
                  "GTF2F2",
                  "NCBP2",
                  "CDC73",
                  "POLR2L",
                  "CCNT2",
                  "RNF8",
                  "WDR61",
                  "POLR2I"
                ],
                "name": "transcription elongation from RNA polymerase II promoter"
              }
            }
          ],
          "edges": [
            {
              "data": {
                "id": "GO:0006354_GO:0006368",
                "source": "GO:0006354",
                "target": "GO:0006368",
                "intersection": [
                  "POLR2G",
                  "CDK9",
                  "POLR2H",
                  "SUPT16H",
                  "GTF2F1",
                  "ELP3",
                  "SUPT4H1",
                  "NCBP1",
                  "IWS1",
                  "ERCC2",
                  "ADRM1",
                  "CDK7",
                  "POLR2C",
                  "CDK13",
                  "NELFB",
                  "ELOA3D",
                  "ELOB",
                  "SOX10",
                  "POLR2J",
                  "ELL3",
                  "CCNT1",
                  "RNF168",
                  "NELFA",
                  "HNRNPU",
                  "EAF1",
                  "RTF1",
                  "MLLT3",
                  "ELOA3B",
                  "LEO1",
                  "GTF2H2",
                  "POLR2B",
                  "POLR2E",
                  "PCID2",
                  "AFF4",
                  "SUPT6H",
                  "GTF2H3",
                  "ERCC3",
                  "EAF2",
                  "NELFE",
                  "POLR2F",
                  "BRD4",
                  "ELOA2",
                  "PAF1",
                  "GTF2H4",
                  "EAPP",
                  "POLR2K",
                  "ELP4",
                  "EZH2",
                  "ELOF1",
                  "POLR2D",
                  "AXIN1",
                  "ELP2",
                  "ZMYND11",
                  "MLLT1",
                  "SHH",
                  "CTR9",
                  "ELL",
                  "ELOA3",
                  "ELOC",
                  "ELOA",
                  "BTBD18",
                  "CCNK",
                  "ELP1",
                  "MNAT1",
                  "POLR2A",
                  "CDK12",
                  "GTF2H1",
                  "CTDP1",
                  "RECQL5",
                  "CCNH",
                  "SSRP1",
                  "ENY2",
                  "TCEA1",
                  "SETD2",
                  "GTF2H5",
                  "ELL2",
                  "SUPT5H",
                  "GTF2F2",
                  "NCBP2",
                  "CDC73",
                  "POLR2L",
                  "CCNT2",
                  "RNF8",
                  "WDR61",
                  "POLR2I"
                ],
                "similarity": 0.931958762886598
              }
            }
          ]
        }
      }
    };
    expect(res).to.deep.equal(result);
  });

  it('parameters: invalid similarityCutoff', function () {
    chai.assert.throws(function(){
      generateEnrichmentNetworkJson({ "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, 3.55 );},
      Error, "similarityCutoff out of range [0, 1]"
    );
  });

  it('parameters: invalid jaccardOverlapWeight', function () {
    chai.assert.throws(function(){
      generateEnrichmentNetworkJson({ "GO:0006354": { "p_value": 1 }, "GO:0006368": { "intersection": ["AFF4"] }}, .55, 75 );},
      Error, "jaccardOverlapWeight out of range [0, 1]"
    );
  });

});