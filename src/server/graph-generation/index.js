const _ = require('lodash');
const sbgn2CyJson = require('sbgnml-to-cytoscape');
const pcServices = require('../pathway-commons');
const {getBioPaxMetadata} = require('./biopax-metadata');
const {getNodesGeneSynonyms} = require('./generic-physical-entities');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayMetadata(uri) {

  let title, dataSource, comments, organism;
  let getValue = data => data.traverseEntry[0].value;
  let get = path => pcServices.query({cmd:'traverse', uri, path}).then(getValue);

  return Promise.all([
    get('Named/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    get('Entity/comment').then(value => comments = value),
    get('Entity/organism/displayName').then(value => organism = value)
  ]).then(() => ({ comments, dataSource, title, organism }));
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri
function getPathwayElementJson(uri) {
  let baseElementJson, biopaxJson;

  return Promise.all([
    pcServices.query({uri, format: 'sbgn'}).then(file => {
      baseElementJson = sbgn2CyJson(file);
    }),
    pcServices.query({uri, format: 'jsonld'}).then(file => biopaxJson = file)
  ]).then(() => {

    const nodesMetadata = getBioPaxMetadata(biopaxJson, baseElementJson.nodes);
    const nodesGeneSynonyms = getNodesGeneSynonyms(baseElementJson.nodes);

    const augmentedNodes = baseElementJson.nodes.map(node => {
      const augmentedNode = node;
      augmentedNode.data.parsedMetadata = nodesMetadata[node.data.id];
      augmentedNode.data.geneSynonyms = nodesGeneSynonyms[node.data.id];

      return augmentedNode;
    });

    return {
      nodes: augmentedNodes,
      edges: baseElementJson.edges
    };
  });
}

//Return enhanced cytoscape json. Requires a valid pathway uri
function getPathwayJson(uri) {
  let pathwayData, elementData;

  return Promise.all([
    getPathwayMetadata(uri).then(data => pathwayData = _.assign({}, data, { uri: uri })),
    getPathwayElementJson(uri).then(data => elementData = data)
  ]).then(() => {
    return _.assign({}, elementData, { pathwayMetadata: pathwayData });
  });
}

module.exports = { getPathwayJson };
