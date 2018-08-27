const { expect, assert } = require('chai');
const fs = require('fs');
const path = require('path');
const { sifText2CyJson, getInteractionsCyJson  } = require('../../../src/server/graph-generation/interaction');
const tp53InteractionsJson = require('./tp53-interactions.json');

describe('Interactions network to cy.js conversion', function(){
  it('converts sif text into a interactions json readable by cytoscape.js', function(){

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
            "metric": 1
          }
        },
        {
          "data": {
            "class": "ball",
            "id": "FOXB1",
            "label": "FOXB1",
            "queried": false,
            "metric": 1
          }
        }
      ],
      "edges": [
        {
          "data": {
            "id": "AARS2 interacts-with FOXB1",
            "source": "AARS2",
            "target": "FOXB1",
            "class": "Binding"
          },
          "classes": "Binding"
        }
      ]
    };

    return expect( JSON.stringify(required, null, 2) ).to.equal( JSON.stringify(actual, null, 2) );
  });

  it('filteres nodes by degree', function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'tp53-interactions.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let required = getInteractionsCyJson( tp53InteractionsTxt, geneIds );

    // return expect( JSON.stringify(required, null, 2) ).to.equal( JSON.stringify(tp53InteractionsJson, null, 2) );
    return expect( required ).to.deep.equal(tp53InteractionsJson );

  });
});
