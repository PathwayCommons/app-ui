const { pathwayInfoTable } = require('./pathway-table');
const { generateEdgeInfo, fetchPathwayInfo } = require('./generate-info');
const _ = require('lodash');


// generateGraphInfo(pathways, similarityCutoff = 0.375, jaccardOverlapWeight) takes a
// list of pathway information 'pathways', a number for cutoff point 'similarityCutoff'
// and the weight for Jaccard coefficient 'jaccardOverlapWeight'
// and returns the graph information for pathways based on 'similarityCutoff' and 'jaccardOverlapWeight'
const generateGraphInfo = (pathways, similarityCutoff = 0.375, jaccardOverlapWeight) => {
  if (similarityCutoff < 0 || similarityCutoff > 1) {
    throw new Error('ERROR: similarityCutoff out of range [0, 1]');
  }
  if (typeof(similarityCutoff) != 'number') {
    throw new Error('ERROR: similarityCutoff is not a number');
  }
  if (jaccardOverlapWeight < 0 || jaccardOverlapWeight > 1) {
    throw new Error('ERROR: jaccardOverlapWeight out of range [0, 1]');
  }
  if (jaccardOverlapWeight != undefined && typeof(jaccardOverlapWeight) != 'number') {
    throw new Error('ERROR: jaccardOverlapWeight should be a number');
  }
  //default jaccardOverlapWeight = 0.5
  if (jaccardOverlapWeight === undefined ) {
    jaccardOverlapWeight = 0.5;
  }

  // check unrecognized and duplicates, modify pathwayIdList
  const unrecognized = new Set();
  for (let pathwayId in pathways) {
    if (!pathways.hasOwnProperty(pathwayId)) continue;
    if (!pathwayInfoTable.has(pathwayId)) {
      unrecognized.add(pathwayId);
      delete pathways[pathwayId];
    }
  }
  const pathwayIdList = [];
  for (let pathwayId in pathways) {
    if (!pathways.hasOwnProperty(pathwayId)) continue;
    pathwayIdList.push(pathwayId);
  }
  // generate node and edge info
  const elements = {};
  elements.nodes = [];
  elements.edges = [];

  const pathywayInfo = fetchPathwayInfo(pathwayIdList);
  for (let pathwayId in pathways) {
    if (!pathways.hasOwnProperty(pathwayId)) continue;
    const geneNum = _.find(pathywayInfo, {pathwayId: pathwayId}).genes.length;
  }

  const edgeInfo = generateEdgeInfo(pathywayInfo, jaccardOverlapWeight, similarityCutoff);
  _.forEach(edgeInfo, edge => {
    const sourceIndex = 0;
    const targetIndex = 1;
    const sourceTarget = edge.edgeId.split('_');
    const source = sourceTarget[sourceIndex];
    const target = sourceTarget[targetIndex];
    elements.edges.push({
      data: {
        id: edge.edgeId,
        source: source,
        target: target,
        similarity: edge.similarity,
        intersection: edge.intersection
      }
    });
  });
  return { unrecognized: Array.from(unrecognized), graph: {elements: elements} };
};


module.exports = { generateGraphInfo };
