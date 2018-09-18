const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { sifText2CyJson, getInteractionsCyJson  } = require('../../../src/server/graph-generation/interaction');
const { MAX_SIF_NODES } = require('../../../src/config');

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
            "id": "PER2",
            "queried": false,
            "metric": 1
          }
        },
        {
          "data": {
            "class": "ball",
            "id": "TP53",
            "queried": true,
            "metric": Number.MAX_SAFE_INTEGER + 1
          }
        },
        {
          "data": {
            "class": "ball",
            "id": "TAF1B",
            "queried": false,
            "metric": 1
          }
        }
      ],
      "edges": [
        {
          "data": {
            "id": "PER2 interacts with TP53",
            "type": "interacts-with",
            "source": "PER2",
            "target": "TP53",
            "pubmedIds": [
              "25103245",
              "27834218"],
            "pcIds": [
              "http://pathwaycommons.org/pc2/MolecularInteraction_835945a6-e226-41ec-8bf9-1a9bc8bb550b___null__189686_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_4dc75645-e45a-482a-96dc-f60ad8a67a9f___null__331105_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_af827701-862c-4adf-9b5e-a42c0dbd46cc___null__331104_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_733e1ab2-28cf-4b21-92f2-a5559223139d___null__189691_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_cdc3cd60-c6a6-409c-a66c-c042680a1a75___null__189689_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_614d9f24-02ea-49d0-b605-3c145bcf6f9b___null__189690_"]
          },
          "classes": "Binding"
        },
        {
          "data": {
            "id": "TAF1B interacts with TP53",
            "type": "interacts-with",
            "source": "TAF1B",
            "target": "TP53",
            "pubmedIds": [
              "10913176"
            ],
            "pcIds": [
              "http://pathwaycommons.org/pc2/MolecularInteraction_96afeee5-5c18-4f9f-923c-d43e6c98f236___null__35104_",
              "http://pathwaycommons.org/pc2/MolecularInteraction_be0f28ab-0347-4468-bcae-613659bed328___null__4532_"
            ]
          },
          "classes": "Binding"
        }
      ]
    };

    return expect( JSON.stringify(required, null, 2) ).to.equal( JSON.stringify(actual, null, 2) );
  });

  it('filters nodes by degree', function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'tp53-interactions.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let { nodes } = sifText2CyJson( tp53InteractionsTxt, geneIds );
    let expectedNodeLabels = nodes.sort( ( n0, n1 ) => n1.data.metric - n0.data.metric).slice(0, MAX_SIF_NODES).map( n => n.data.id );
    let actualNodeLabels = getInteractionsCyJson( tp53InteractionsTxt, geneIds ).nodes.map( n => n.data.id );

    return expect( expectedNodeLabels ).to.deep.equal( actualNodeLabels );

  });

  it('filters nodes with 0 degree', function(){

    let input = ``;

    let geneIds = ['TP53'];
    let result = getInteractionsCyJson( input, geneIds );

    return expect( result.nodes ).to.deep.equal( [] );
  });

});
