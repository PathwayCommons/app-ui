const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { sifText2CyJson, getInteractionsCyJson  } = require('../../../src/server/graph-generation/interaction');

describe('Interactions network to cy.js conversion', function(){
  it('converts sif text into a json format readable by cytoscape.js', function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'small-interactions-sif.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let required = sifText2CyJson( tp53InteractionsTxt, geneIds );
    let actual = {
      "nodes": [
        {
          "data": {
            "class": "ball",
            "id": "AARS2",
            "queried": false,
            "metric": 1,
            "types": ["Protein"],
            "externalIds": {
              "uniprot knowledgebase": "Q5JTZ9",
              "hgnc symbol": "AARS2"
            }
          }
        },
        {
          "data": {
            "class": "ball",
            "id": "FOXB1",
            "queried": false,
            "metric": 1,
            "types": ["Protein"],
            "externalIds": {
              "uniprot knowledgebase": "Q99853",
              "hgnc symbol": "FOXB1"
            }
          }
        },
        {
          "data": {
            "class": "ball",
            "id": "SFN",
            "queried": false,
            "metric": 0,
            "types": ["Dna", "DnaRegion", "Protein", "Rna"],
            "externalIds": {
              "ensembl": "ENSG00000175793",
              "refseq": "NT_037485",
              "uniprot knowledgebase": "P31947",
              "hgnc symbol": "SFN",
              "hgnc": "10773",
              "ncbi gene": "2810",
              "omim": "601290"
            }
          }
        }
      ],
      "edges": [
        {
          "data": {
            "id": "AARS2 interacts with FOXB1",
            "source": "AARS2",
            "target": "FOXB1",
            "pubmedIds": ["25609649"],
            "pcIds": ["http://pathwaycommons.org/pc2/MolecularInteraction_888e58e7-2c6a-4325-b88b-06860e7c35b6__IM-24178-104_1803613_"],
            "reactomeIds": []
          },
          "classes": "Binding"
        },
        {
          "data": {
            "id": "TP53 controls expression of MDM2",
            "source": "TP53",
            "target": "MDM2",
            "pubmedIds": [
              "10837373",
              "12138177",
              "15546879",
              "16439685",
              "17409421",
              "17982676",
              "19846903",
              "20375080",
              "21109480",
              "23566959",
              "24068677",
              "27634759",
              "28785074",
              "7651818",
              "8319905"
            ],
            "pcIds": [
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_fedc462c9a3609ed85aad1bf91af9891",
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_4cd33d082365955ac3e37fb590d28ed8",
              "http://pathwaycommons.org/pc2/Control_0bb202ca4b0953e3c6b76903e0b25c48",
              "http://pathwaycommons.org/pc2/Control_f677fdee0c3af8c41dc73f3d8ba3435d",
              "http://pathwaycommons.org/pc2/Control_a178e2508357148794d552026f651ad4",
              "http://pathwaycommons.org/pc2/Control_862034374bba1dbc7b398f5d520b51bb",
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_9deb771e4764b12221f4221114cbe1c3",
              "http://pathwaycommons.org/pc2/Control_d119a6730898aec961ed2062fa9a190d",
              "http://pathwaycommons.org/pc2/Control_c9b3d8fcf535301f2dbc443a9b46430e",
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_4ac81004ea0fd77d6f55a4922a2a4452",
              "http://pathwaycommons.org/pc2/TemplateReaction_b910f3a4d3b6814f458329f97376bde1",
              "http://pathwaycommons.org/pc2/TemplateReaction_48e0723b1af21f12cc2c278931b62576",
              "http://pathwaycommons.org/pc2/Control_c4783feaacdc2d29347c6db39d8009e2",
              "http://pathwaycommons.org/pc2/Control_789bfef99e5faa67afce47bc58c84d54",
              "http://pathwaycommons.org/pc2/Control_a7bd0aca265e45a58d7115f658258b5f",
              "http://pathwaycommons.org/pc2/Control_8c17125d9d1db74f73d124907c4124c9",
              "http://pathwaycommons.org/pc2/Control_252295e859f90be0440d56598ba147cd",
              "http://pathwaycommons.org/pc2/Control_f8bf62f21a6fdb75108a19b65df1c4b1",
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_bac827a1ecccd96c36df4be49717bbe0",
              "http://pathwaycommons.org/pc2/TemplateReactionRegulation_5992d93892ee7e4670d621fd9245274d",
              "http://pathwaycommons.org/pc2/Control_238506ddac00226b743b55e702181480",
              "http://pathwaycommons.org/pc2/TemplateReaction_42b582023b2234e53e5311010d4f784d",
              "http://pathwaycommons.org/pc2/Control_5b81aea229b1ecf553c31c68e1af609f",
              "http://pathwaycommons.org/pc2/Control_fc8be79733995c1be8486730ef44f662",
              "http://pathwaycommons.org/pc2/Control_579b44696b5a0b717d36d7aaa54f852f",
              "http://pathwaycommons.org/pc2/Control_bccdb7ecaa39e4633fa32f2179c9f940",
              "http://pathwaycommons.org/pc2/Control_76a9509902636a5cdf6cc6b231d4bff7",
              "http://pathwaycommons.org/pc2/TemplateReaction_2f45057f15d953606ba470837b6eb250"
            ],
            "reactomeIds": [
              "http://identifiers.org/reactome/R-HSA-3700992",
              "http://identifiers.org/reactome/R-HSA-3700995"
            ]
          },
          "classes": "Expression"
        }
      ]
    };

    return expect( JSON.stringify(required, null, 2) ).to.equal( JSON.stringify(actual, null, 2) );
  });

  it('filteres nodes by degree', function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'tp53-interactions.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let { nodes } = sifText2CyJson( tp53InteractionsTxt, geneIds );
    let expectedNodeLabels = nodes.sort( ( n0, n1 ) => n1.data.metric - n0.data.metric).slice(0, 50).map( n => n.data.id );
    let actualNodeLabels = getInteractionsCyJson( tp53InteractionsTxt, geneIds ).nodes.map( n => n.data.id );

    return expect( expectedNodeLabels ).to.deep.equal( actualNodeLabels );

  });
});
