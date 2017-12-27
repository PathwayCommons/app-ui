const fs = require('fs');
const sbgn2cy = require('sbgnml-to-cytoscape');

const pc = require('../server/pathway-commons');
const metadataMapperJson = require('../server/graph-generation/metadataMapperJson');
const cjson = require('../server/graph-generation/cytoscapeJson');

const augmentCynodes = require('./metadata');

const processedSearchResults = require('./processed_pathway_search_results.json');

const getAllPathwaySearchHits = async () => {
  const allSearchResults = [];

  for (let i = 0; i < 59; i++) {
    const results = await pc.search({q: '*', type: 'Pathway', format: 'json', page: i});

    for (const result of results.searchHit) {
      allSearchResults.push({uri: result.uri, size: result.numParticipants });
    }
  }
  console.log(allSearchResults.length);
  fs.writeFile(__dirname + '/all_pathway_search_results.json', JSON.stringify(allSearchResults, null, 2), 'utf8', err => {
    if (err) throw err;
  
    console.log('results saved');
  });
};

const getPathwayLevelMetadata = (uri) => {

  let name, datasource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pc.traverse({uri, path}).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => name = value),
    get('Entity/dataSource/displayName').then(value => datasource = value),
    get('Entity/comment').then(value => comments = value),
    get('Entity/organism/displayName').then(value => organism = value)
  ]).then(data => {
    return { datasource: datasource.pop(), name: name.pop(), organism: organism.pop(), comments };
  });
}

const getElementLevelMetadata = (uri) => {
  let sbgn, biopax;
  let downloadType = 'jsonld';

  //Get SBGN and Biopax Files
  return Promise.all([
    pc.get({uri, format: 'sbgn'}).then(file => sbgn = file),
    pc.get({uri, format: downloadType}).then(file => biopax = file)
  ]).then(files => metadataMapperJson(biopax, sbgn));
}

const getAllSbgn = async () => {
  const failed = [];
  for (let i = 0; i < processedSearchResults.length; i++) {
    const result = processedSearchResults[i];
    let sbgn = {};
    sbgn.uri = result.uri;
    try {
      const elements = await pc.get({uri: result.uri, format: 'sbgn'});
      sbgn.elements = sbgn2cy(elements);

      const dir = __dirname + '/sbgn/' + i +'.json';
      fs.writeFileSync(__dirname + '/sbgn/' + i +'.json', JSON.stringify(sbgn, null, 2), 'utf8', err => {
        if (err) {console.log(err)};
        console.log('saved ', i);
      })
    } catch (e) {
      console.log(`failed to get sbgn for uri ${result.uri} at index ${i}`);
      console.log(e);
      sbgn.elements = {};
      failed.push(result);
    }
  }

  console.log(failed);
}

const getAllJsonld = async () => {
  const failed = [];
  for (let i = 0; i < processedSearchResults.length; i++) {
    const result = processedSearchResults[i];
    let jsonld = {};
    jsonld.uri = result.uri;
    try {
      const biopax = await pc.get({uri: result.uri, format: 'jsonld'});
      jsonld.biopax = JSON.parse(biopax);

      const dir = __dirname + '/jsonld/' + i +'.json';
      fs.writeFileSync(__dirname + '/jsonld/' + i +'.json', JSON.stringify(jsonld, null, 2), 'utf8', err => {
        if (err) {console.log(err)};
        console.log('saved ', i);
      })
    } catch (e) {
      console.log(`failed to get sbgn for uri ${result.uri} at index ${i}`);
      console.log(e);
      failed.push(result);
    }
  }

  console.log(failed);
}


const getPathwayJson = async (uri) => {
  const pathwayData = await getPathwayLevelMetadata(uri);
  const elementData = await getElementLevelMetadata(uri);

  const result = {pathwayData, elementData};

  return result;
}

const getAllPathwayJson = async () => {
  const pathways = [];

  let i;
  for (i = 0; i < processedSearchResults.length; i++) {
    const result = processedSearchResults[i];
    let pathway;
    try {
      pathway = await getPathwayJson(result.uri);
    } catch (e) {
      pathway = {
        pathwayData: {
          datasource: null,
          name: null,
          comments: null
        },
        elementData: null
      }
    }
    const size = result.size;
    pathways.push({
      id: result.uri,
      datasource: pathway.pathwayData.datasource,
      name: pathway.pathwayData.name,
      comments: pathway.pathwayData.comments,
      size: size,
      elements: pathway.elementData
    });
  }
  console.log(pathways.length);
  fs.writeFile('./all_processed_pathways.json', JSON.stringify(pathways, null, 2), 'utf8', err => {
    if (err) throw err;
  
    console.log('results saved');
  });  

};

const addMetadataToElements = (biopax, cyElements) => {
  const nodes = augmentCynodes(biopax, cyElements.nodes);

  return {
    edges: cyElements.edges,
    nodes: nodes
  };
} 

const generateAllPathways = async () => {
  const sbgns = fs.readdirSync(__dirname + '/sbgn').sort((a, b) => parseInt(a.split('.')[0]) - parseInt(b.split('.'[0])));
  const jsonlds = fs.readdirSync(__dirname + '/jsonld').sort((a, b) => parseInt(a.split('.')[0]) - parseInt(b.split('.'[0])));

  let i;
  for (i = 0; i < sbgns.length; i++) {

    try {
      const sbgn = JSON.parse(fs.readFileSync(__dirname + '/sbgn/' + sbgns[i]));
      const jsonld = fs.readFileSync(__dirname + '/jsonld/' + jsonlds[i], 'utf-8');
      
      const uri = sbgn.uri;
      const elements = sbgn.elements;

      const pathwayData = await getPathwayLevelMetadata(uri);
      const elementData = addMetadataToElements(jsonld, elements);
  
      const pathway = {
        id: uri,
        datasource: pathwayData.datasource,
        name: pathwayData.name,
        comments: pathwayData.comments,
        size: processedSearchResults[i].size,
        elements: elementData
      };

      fs.writeFileSync(__dirname + '/pathways/' + i +'.json', JSON.stringify(pathway, null, 2), 'utf8', err => {
        if (err) {console.log(err)};
        console.log('saved ', i);
      });
    } catch (e) {
      console.log(`failed ot create pathway ${i}`);
    }
  }
  
}

// getAllPathwaySearchHits();
// getAllPathwayJson();

// getAllSbgn();
// getAllJsonld();

generateAllPathways();

const test = async () => {
  const md = await cjson.getCytoscapeJson('http://identifiers.org/reactome/R-HSA-5690714');
  console.log(JSON.stringify(md.nodes, null, 2));
}

// test()