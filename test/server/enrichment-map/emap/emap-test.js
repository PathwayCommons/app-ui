const chai = require('chai');
const expect = chai.expect;
const {generateCys} = require('../../../server/enrichment-map/emap');


describe('test generateCys', function() {
  it('it should return an object', function() {
    return (generateCys({"GO:0006354": {"pValue": 1, "t": 124}, "GO:0006368": {"qAndTList": ["AFF4"]}})).then(function(res) {
      const result = {
        "unrecognized": [],
        "graph": [
          {
            "data": {
              "id": "GO:0006354",
              "pValue": 1,
              "t": 124
            }
          },
          {
            "data": {
              "id": "GO:0006368",
              "qAndTList": [
                "AFF4"
              ]
            }
          },
          {
            "data": {
              "id": "GO:0006354_GO:0006368",
              "source": "GO:0006354",
              "target": "GO:0006368",
              "similarity": 0.8255813953488372,
              "intersection": [
                "TAF12",
                "MLLT1",
                "CTR9",
                "GTF2H5",
                "TAF1",
                "TAF10",
                "EAF2",
                "ERCC2",
                "ENY2",
                "TAF2",
                "GTF2H1",
                "CDC73",
                "RTF1",
                "MNAT1",
                "NCBP1",
                "SUPT6H",
                "TBP",
                "TAF4",
                "POLR2L",
                "SUPT16H",
                "GTF2B",
                "ELOA",
                "ELP3",
                "CCNT2",
                "ADRM1",
                "ELL2",
                "WDR61",
                "AFF4",
                "ZMYND11",
                "ELP1",
                "CTDP1",
                "CDK9",
                "TCEA1",
                "ELOF1",
                "CCNK",
                "BRD4",
                "CDK13",
                "TAF7",
                "POLR2A",
                "GTF2A1",
                "SHH",
                "AXIN1",
                "PAF1",
                "SSRP1",
                "SETD2",
                "POLR2F",
                "TAF9B",
                "POLR2G",
                "SOX10",
                "POLR2C",
                "POLR2J",
                "CDK12",
                "GTF2H3",
                "NCBP2",
                "TAF13",
                "TAF5",
                "ELOB",
                "POLR2H",
                "NELFB",
                "ELOA3",
                "SUPT5H",
                "ELL",
                "TAF4B",
                "NELFA",
                "ERCC3",
                "GTF2H4",
                "EAF1",
                "ELL3",
                "EZH2",
                "CDK7",
                "LEO1",
                "TAF11",
                "TAF9",
                "TAF3",
                "NELFE",
                "POLR2D",
                "GTF2F2",
                "RNF8",
                "TAF6",
                "IWS1",
                "MLLT3",
                "GTF2A2",
                "ELOA2",
                "GTF2E1",
                "CCNH",
                "GTF2F1",
                "PCID2",
                "ELP2",
                "POLR2B",
                "GTF2E2",
                "RECQL5",
                "ELOA3D",
                "POLR2I",
                "SUPT4H1",
                "ELP4",
                "CCNT1",
                "GTF2H2",
                "RNF168",
                "EAPP",
                "POLR2K",
                "POLR2E",
                "TAF1L",
                "ELOA3B",
                "ELOC"
              ]
            }
          }
        ]
      };
      expect(res).to.deep.equal(result);
    });
  });
});