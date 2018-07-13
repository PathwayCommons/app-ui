const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const { enrichment } = require('../../../../src/server/enrichment/analysis');


describe('test enrichment analysis', function () {
  this.timeout(500000);
  it('only input gene', function () {
    return (enrichment(['AFF4'])).then(
      //resolved
      function (res) {
      const result = {
        "pathwayInfo": {
          "GO:0006354": {
            "p-value": 0.0087,
            "description": "DNA-templated transcription, elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "GO:0006368": {
            "p-value": 0.0087,
            "description": "transcription elongation from RNA polymerase II promoter",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:674695": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Pre-transcription Events",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:75955": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Transcription Elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:112382": {
            "p-value": 0.00775,
            "description": "Formation of RNA Pol II elongation complex",
            "intersection": [
              "AFF4"
            ]
          }
        }
      };
      expect(res).to.deep.equal(result);
    },
    //rejected
    rej => {
    console.log("rejected");
    }
    );
  });

  it('all valid parameters', function () {
    return (enrichment(['AFF4'], {minSetSize: 3, maxSetSize:400, backgroundGenes: []})).then(
      //resolved
      res=> {
      const result = {
        "pathwayInfo": {
          "GO:0006354": {
            "p-value": 0.0087,
            "description": "DNA-templated transcription, elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "GO:0006368": {
            "p-value": 0.0087,
            "description": "transcription elongation from RNA polymerase II promoter",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:674695": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Pre-transcription Events",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:75955": {
            "p-value": 0.00775,
            "description": "RNA Polymerase II Transcription Elongation",
            "intersection": [
              "AFF4"
            ]
          },
          "REAC:112382": {
            "p-value": 0.00775,
            "description": "Formation of RNA Pol II elongation complex",
            "intersection": [
              "AFF4"
            ]
          }
        }
      };
      expect(res).to.deep.equal(result);
    },
    //rejected
    rej => {
    console.log("rejected")
    }
    );
  });

  it('INVALID parameters', function () {
    return (enrichment(['AFF4'], {minSetSize: 3, maxSetSize:"not a number", backgroundGenes: []})).then(
      //resolved
      res => {
      console.log("resolved");
      },
      //rejected
      rej => {
      expect(true);
      }
    );
  });

  it('background parameter check', function () {
    return (enrichment(["DOT1L","AFF4","NAP1L3","BRPF1","TCF20","HLTF","SIRT1","TDG","SUV39H2","CBX7","DNMT1","DPY30","ING5","MLLT6","CHD1L","USP27X","BRPF3","ELP4","HCFC1","MARCH5","SCML2","PRDM10","SUPT16H","TRIM24","GTF2H1","KDM3A","PAF1","PCGF5","BAZ1B","NCOA1","UBE2B","SGF29","KDM5B","MTA3","PCMT1","GTF3C4","MTA2","RBBP4","RNF20","SETD2","SSRP1","MBD1","POLR2B","TP53BP1","UBR7","ARID4B","ASH1L","BRD4","HAT1","HDAC1","KAT2A","MBD3","MSL3","RPA3","BAZ2A","JMJD6","PHF7","SIN3B","SP100","ZMYND11"],
     {minSetSize: 5, maxSetSize: 250,
      backgroundGenes: ["HDAC3","TRIM24","PRDM6","ATR","PBRM1","PHF3","ING4","DNMT1","NCOA1","TDG","BRD4","BRPF1","AFF4","ATRX","MTA1","ASH1L","USP27X","DOT1L","ELP4","RING1","JMJD4","HDAC4","KAT6A","NCOR1","PSIP1","RBBP5","ASXL3","MLLT6","MARCH5","PARP2","TRIM28","INO80","TCF20","CBX7","POLR2B","TDRD6","NCOR2","PRMT5","HDAC8","SMARCA2","CHD1","DMAP1","KDM5A","HLTF","KMT2A","MUM1","DPY30","HCFC1","KAT2A","MTA3","NAP1L3","HDGFL2","NSD2","CHD5","RAI1","ELP3","CBX2","PRDM10","CBX5","NSD1","PHF12","BAZ1B","BRPF3","PCGF5","SUV39H2","PRDM1","SCML2","BOP1","TRIM33","ING5","PRDM16","EP300","PRMT1","SIRT1","SMARCD1","BAZ2B","KDM3B","EPC2","FBXO44","KDM5D","KIAA2026","PCMT1","PRDM14","GTF3C4","HSPBAP1","L3MBTL2","PHC1","SETD2","SETDB1","SMNDC1","DNMT3B","ZCWPW2","GTF2B","TDRD3","KDM4B","PADI4","BRD2","EZH2","KDM4D","LBR","SFMBT1","SP140","SSRP1","ATM","SIN3B","SUPT16H","TP53BP1","CHD1L","CHD4","PHF7","PRMT8","RAG2","ARID4B","ERCC5","KDM5B","MBD1","MTF2","PRDM5","RPA3","ZMYND11","FKBP1A","MEN1","SIRT4","SIRT7","SMYD4","KAT2B","KAT8","KDM2A","KDM2B","L3MBTL3","RNF20","SETD5","ASH2L","SETDB2","USP17L5","GTF2F1","HR","KDM3A","PAF1","UBE2B","CBX4","GTF2H1","PRMT7","FBXL19","HDAC1","SETD6","SFMBT2","SMYD1","TDRD5","CDY2A","CHD3","ING3","JMJD6","MBTD1","NAP1L1","PADI1","SETD1A","SIRT5","SMN1","TAF1","USP22","BAZ1A","SGF29","KAT5","MBD3","MTA2","PADI3","PHF8","PRDM12","PRMT6","RBBP4","RBBP7","SETMAR","SP110","BPTF","CDY1","MSL3","PHF6","PHIP","TDRKH","UBR7","CDYL2","CLOCK","GADD45B","HAT1","PHF13","PRKAA2","BAZ2A","BRWD3","L3MBTL4","MLLT10","RNF217","SMYD5","PHF11","PHF16","KMT5B","WDR82","BRD1","GLYR1","HDAC2","KANSL1","KDM4E","PAXIP1","JADE1","SP100","SP140L","TDRD10","TRIM66","EED","EZH1","ORC1","PHC3","PRDM9","SIRT2","ZGPAT","CREBBP","DNMT3A","HELLS","KAT7","RNF17","TAF1L","ZMYND8","AIRE","RIOX1","CARM1","EHMT2","EP400","HDAC7","KDM1A","MBD2","MBD4","PRKAA1","SHPRH","SMARCC2","BRD3","ING2","JMJD8","MPHOSPH8","PHF21A","SATB1","SCMH1","TET1","UBE2E1","CHAF1A","FKBP2","H2AFZ","HDAC11","KAT6B","KDM6A","NCOA3","PADI6","PRDM15","PWWP2B","SCML4","SIN3A","SMARCE1","USP51","ASXL1","CHD7","CHD9","DNMT3L","FBXW9","INTS12","L3MBTL1","MBD5","MECP2","NAP1L2","PHF2","KMT5A","SMARCA4","SRCAP","ASXL2","CHAF1B","CSTL1","FKBP5","FMR1","FXR2","HDAC6","ING1","IWS1","JARID2","KDM4A","PCGF6","PHF20","PHF21B","PRMT2","SETD7","SIRT6","SMYD3","DPF2","PCGF2","PHC2","PRMT3","STK31","TDRD12","TET2","TET3","UHRF1","WDR5","CDYL","CECR2","CXXC1","EHMT1","G2E3","HDAC10","KDM4C","KDM6B","KDM8","PARP1","PCGF1","PRDM13","SIRT3","SMARCA1","SMARCC1","TDRD7","UBE2A","UHRF2","AFF1","AKAP1","ARID4A","ATAD2","BRD8","HDAC5","MORF4L1","PHF10","PYGO2","SMYD2","SUV39H1","TCEA1","TCF19","TDRD1","TDRD9","NSD3","BRD9","CBX1","HDGFL1","HIRA","KDM5C","MECOM","KMT2E","PHF1","PHRF1","PRDM2","PRKCD","RNF2","SMARCA5","SUZ12","BMI1","BRDT","CHD2","CHD6","EPC1","JMJD1C","KMT2C","KMT2D","MSH6","PHF19","PHF20L1","PHF23","PRDM4","SETD1B","TAF3","UTY","ATAD2B","ATAT1","AURKB","BRWD1","CHD8","HDGFRP3","JMJD7-PLA2G4B","KDM1B","JADE2","KMT5C","BRD7","CBX8","DIDO1","FBXO17","GAPDH","PHF5A","PPARGC1A","PRDM11","PRDM7","REN","RPH3A","SETD3","UBE2I","ZCWPW1","HIF1AN","PRDM8","SETD4","SMARCD3","CBX3","CBX6","GADD45A","HDAC9","PADI2","ACTL6B","DPF3","PHF14","RNF40","PYGO1","RSF1","SND1","HDGF","RIOX2","MYC","DPF1"]})).then(
      //resolved
      res => {
        const result = {
          "pathwayInfo": {
            "GO:0006354": {
              "p-value": 0.0289,
              "description": "DNA-templated transcription, elongation",
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
            },
            "GO:0006368": {
              "p-value": 0.0289,
              "description": "transcription elongation from RNA polymerase II promoter",
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
        };
        expect(res).to.deep.equal(result);
      },
      //rejected
      rej => {
        console.log("rejected");
      }
    );
  });
});