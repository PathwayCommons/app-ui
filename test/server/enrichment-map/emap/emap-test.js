const chai = require('chai');
const expect = chai.expect;
const {generateCys} = require('../../../server/enrichment-map/emap');


describe('test generateCys', function() {
  it('it should return an object', function() {
    return (generateCys({"GO:0006354": {"p-value": 1}, "GO:0006368": {"intersection": ["AFF4"]}})).then(function(res) {
      const result = {
        "unrecognized": [],
        "graph": {
          "elements": {
            "nodes": [
              {
                "data": {
                  "id": "GO:0006354",
                  "p-value": 1
                }
              },
              {
                "data": {
                  "id": "GO:0006368",
                  "intersection": [
                    "AFF4"
                  ]
                }
              }
            ],
            "edges": [
              {
                "data": {
                  "id": "GO:0006354_GO:0006368",
                  "source": "GO:0006354",
                  "target": "GO:0006368",
                  "similarity": 0.9031007751937985,
                  "intersection": [
                    "ADRM1",
                    "AFF4",
                    "AXIN1",
                    "BRD4",
                    "CCNH",
                    "CCNK",
                    "CCNT1",
                    "CCNT2",
                    "CDC73",
                    "CDK12",
                    "CDK13",
                    "CDK7",
                    "CDK9",
                    "CTDP1",
                    "CTR9",
                    "EAF1",
                    "EAF2",
                    "EAPP",
                    "ELL",
                    "ELL2",
                    "ELL3",
                    "ELOA",
                    "ELOA2",
                    "ELOA3",
                    "ELOA3B",
                    "ELOA3D",
                    "ELOB",
                    "ELOC",
                    "ELOF1",
                    "ELP1",
                    "ELP2",
                    "ELP3",
                    "ELP4",
                    "ENY2",
                    "ERCC2",
                    "ERCC3",
                    "EZH2",
                    "GTF2A1",
                    "GTF2A2",
                    "GTF2B",
                    "GTF2E1",
                    "GTF2E2",
                    "GTF2F1",
                    "GTF2F2",
                    "GTF2H1",
                    "GTF2H2",
                    "GTF2H3",
                    "GTF2H4",
                    "GTF2H5",
                    "IWS1",
                    "LEO1",
                    "MLLT1",
                    "MLLT3",
                    "MNAT1",
                    "NCBP1",
                    "NCBP2",
                    "NELFA",
                    "NELFB",
                    "NELFE",
                    "PAF1",
                    "PCID2",
                    "POLR2A",
                    "POLR2B",
                    "POLR2C",
                    "POLR2D",
                    "POLR2E",
                    "POLR2F",
                    "POLR2G",
                    "POLR2H",
                    "POLR2I",
                    "POLR2J",
                    "POLR2K",
                    "POLR2L",
                    "RECQL5",
                    "RNF168",
                    "RNF8",
                    "RTF1",
                    "SETD2",
                    "SHH",
                    "SOX10",
                    "SSRP1",
                    "SUPT16H",
                    "SUPT4H1",
                    "SUPT5H",
                    "SUPT6H",
                    "TAF1",
                    "TAF10",
                    "TAF11",
                    "TAF12",
                    "TAF13",
                    "TAF1L",
                    "TAF2",
                    "TAF3",
                    "TAF4",
                    "TAF4B",
                    "TAF5",
                    "TAF6",
                    "TAF7",
                    "TAF9",
                    "TAF9B",
                    "TBP",
                    "TCEA1",
                    "WDR61",
                    "ZMYND11"
                  ]
                }
              }
            ]
          }
        }
      }
      expect(res).to.deep.equal(result);
    });
  });
});