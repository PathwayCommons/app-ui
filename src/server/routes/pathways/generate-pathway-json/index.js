const _ = require('lodash');
const sbgn2CyJson = require('sbgnml-to-cytoscape');

const pcServices = require('../../../external-services/pathway-commons');
const { getBiopaxMetadata, getGeneSymbolsForGenericNodes } = require('./biopax-metadata');
const { populateMetadata } = require('./biopax-metadata/simple');

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayMetadata(uri) {

  let title, dataSource, comments, organism;
  let get = path => pcServices.query({cmd:'pc2/traverse', uri, path})
    .then(data => _.get(data, 'traverseEntry.0.value', null));

  return Promise.all([
    get('Entity/displayName').then(value => title = value),
    get('Entity/dataSource/displayName').then(value => dataSource = value),
    get('Entity/comment').then(value => comments = value),
    get('Pathway/organism/displayName').then(value => organism = value)
  ]).then(() => ({ comments, dataSource, title, organism }));

}

/**
 * Executes a Pathway Commons web query and builds a new JSON network model
 * using the result SBGN (auto-converted to CyJSON) and additional metadata and data
 * from the corresponding BioPAX L3 JSON-LD model and generic entities mapping file (json).
 *
 * @param {*} uri URI representing the network (query)
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
function getPathwayNodesAndEdges(uri) {
  let cyJson, biopaxJson;

  return Promise.all([
    pcServices.query({uri, format: 'sbgn'}).then(file => {
      cyJson = sbgn2CyJson(file);
    }),
    pcServices.query({uri, format: 'jsonld'}).then(file => biopaxJson = file)
  ]).then(() => {

    const nodesMetadata = populateMetadata(cyJson.nodes, biopaxJson);
    const oldNodesMetadata = getBiopaxMetadata(biopaxJson, cyJson.nodes);
    const nodesGeneSynonyms = getGeneSymbolsForGenericNodes(cyJson.nodes);

    const augmentedNodes = cyJson.nodes.map(node => {
      const augmentedNode = node;
      augmentedNode.data.metadata = nodesMetadata[node.data.id] || {};
      augmentedNode.data.parsedMetadata = oldNodesMetadata[node.data.id] || {};
      augmentedNode.data.geneSynonyms = nodesGeneSynonyms[node.data.id];
      return augmentedNode;
    });

    return {
      nodes: augmentedNodes,
      edges: cyJson.edges
    };
  });
}

/**
 *
 * @param {*} uri URI representing the network
 * @returns A Cytoscape JSON which represents the network, enhanced with BioPAX metadata
 */
function getPathwayJson(uri) {
  let pathwayData, elementData;

  return Promise.all([
    getPathwayMetadata(uri).then(data => pathwayData = _.assign({}, data, { uri: uri })),
    getPathwayNodesAndEdges(uri).then(data => elementData = data)
  ]).then(() => {
    return _.assign({}, elementData, { pathwayMetadata: pathwayData });
  });
}

module.exports = { getPathwayJson };
