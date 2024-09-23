const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { sifText2CyJson, getInteractionsCyJson  } = require('../../../src/server/routes/interactions/generate-interactions-json');
const { MAX_SIF_NODES } = require('../../../src/config');
const { mockFetch } = require('../../util');

describe('Interactions network to cy.js conversion', function(){
  before(function() {
    global.fetch = mockFetch( { json: () => [
      {
        "id": 11,
        "identifier": "biogrid",
        "name": [
          "BioGRID"
        ],
        "description": "BioGRID Release 3.5.175 (only BIOGRID-ORGANISM-Homo_sapiens-3.5.175.psi25.xml), 25-Jul-2019",
        "urlToData": "https://downloads.thebiogrid.org/Download/BioGRID/Release-Archive/BIOGRID-3.5.175/BIOGRID-ORGANISM-3.5.175.psi25.zip",
        "homepageUrl": "https://thebiogrid.org/",
        "iconUrl": "https://pathwaycommons.github.io/cpath2/logos/favicon_bigger.png",
        "type": "PSI_MI",
        "cleanerClassname": null,
        "converterClassname": "cpath.converter.PsimiConverter",
        "files": [
          "./data/biogrid/BIOGRID-ORGANISM-Homo_sapiens-3.5.175.psi25.xml.orig.gz"
        ],
        "pubmedId": "16381927",
        "availability": "free",
        "numPathways": 0,
        "numInteractions": 501500,
        "numPhysicalEntities": 1003000
      }, 
      {
        "id": 8,
        "identifier": "hprd",
        "name": [
          "HPRD"
        ],
        "description": "HPRD PSI-MI Release 9; 13-Apr-2010",
        "urlToData": "http://www.hprd.org/download",
        "homepageUrl": "http://www.hprd.org",
        "iconUrl": "https://pathwaycommons.github.io/cpath2/logos/hprd.png",
        "type": "PSI_MI",
        "cleanerClassname": "cpath.cleaner.HPRDCleaner",
        "converterClassname": "cpath.converter.PsimiConverter",
        "files": [
          "./data/hprd/hprd.psimi.xml.orig.gz"
        ],
        "pubmedId": "18988627",
        "availability": "academic",
        "numPathways": 0,
        "numInteractions": 39824,
        "numPhysicalEntities": 83475
      }
    ] } );
  });

  it('converts sif text into a json format readable by cytoscape.js', async function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'small-interactions-sif.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let required = await sifText2CyJson( tp53InteractionsTxt, geneIds );
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
            "datasources": [
              "BioGRID"
            ],
            "pubmedIds": [
              "25103245",
              "27834218"],
            "pathwayNames": [],
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
            "datasources": [
              "BioGRID",
              "HPRD"
            ],
            "pubmedIds": [
              "10913176"
            ],
            "pathwayNames": [],
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

  it('filters nodes by degree', async function(){

    let tp53InteractionsTxt = fs.readFileSync(path.resolve(__dirname, 'tp53-interactions.txt'), 'utf-8');
    let geneIds = ['TP53'];

    let { nodes } = await sifText2CyJson( tp53InteractionsTxt, geneIds );
    let expectedNodeLabels = nodes.sort( ( n0, n1 ) => n1.data.metric - n0.data.metric).slice(0, MAX_SIF_NODES).map( n => n.data.id );
    let actualNodeLabels = await getInteractionsCyJson( tp53InteractionsTxt, geneIds );
    actualNodeLabels = actualNodeLabels.nodes.map( n => n.data.id );

    return expect( expectedNodeLabels ).to.deep.equal( actualNodeLabels );

  });

  it('filters nodes with 0 degree', async function(){

    let input = ``;

    let geneIds = ['TP53'];
    let result = await getInteractionsCyJson( input, geneIds );

    return expect( result.nodes ).to.deep.equal( [] );
  });

});
