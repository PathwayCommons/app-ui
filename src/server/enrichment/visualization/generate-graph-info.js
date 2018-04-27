const { pathwayInfoTable } = require('./pathway-table');
const { generateEdgeInfo } = require('./generate-info');
const _ = require('lodash');


// generateGraphInfo(pathwayInfoList, cutoff = 0.375, JCWeight, OCWeight) takes a
// list of pathway information pathwayInfoList, a number for cutoff point cutoff
// and the weights for Jaccard coefficients and Overlap coefficient JCWeight and
// OCWeight
// and returns the graph information for pathwayInfoList based on cutoff, JCWeight and OCWeight
const generateGraphInfo = (pathwayInfoList, cutoff = 0.375, JCWeight, OCWeight) => {
  if (cutoff < 0 || cutoff > 1) {
    throw new Error('ERROR: cutoff out of range [0, 1]');
  }
  if (typeof(cutoff) != 'number') {
    throw new Error('ERROR: cutoff is not a number');
  }
  if (JCWeight < 0 || JCWeight > 1) {
    throw new Error('ERROR: JCWeight out of range [0, 1]');
  }
  if (OCWeight < 0 || OCWeight > 1) {
    throw new Error('ERROR: OCWeight out of range [0, 1]');
  }
  if (JCWeight != undefined && typeof(JCWeight) != 'number') {
    throw new Error('ERROR: JCWeight should be a number');
  }
  if (OCWeight != undefined && typeof(OCWeight) != 'number') {
    throw new Error('ERROR: OCWeight should be a number');
  }
  if (OCWeight != undefined && JCWeight != undefined && OCWeight + JCWeight != 1) {
    throw new Error('ERROR: OCWeight + JCWeight should be 1');
  }
  if (JCWeight === undefined && OCWeight === undefined) {
    JCWeight = 0.5;
    OCWeight = 0.5;
  } else if (JCWeight === undefined) {
    JCWeight = 1 - OCWeight;
  } else if (OCWeight === undefined) {
    OCWeight = 1 - JCWeight;
  }
  // check unrecognized and duplicates, modify pathwayIdList
  const unrecognized = new Set();
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    if (!pathwayInfoTable.has(pathwayId)) {
      unrecognized.add(pathwayId);
      delete pathwayInfoList[pathwayId];
    }
  }
  const pathwayIdList = [];
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    pathwayIdList.push(pathwayId);
  }
  // generate node and edge info
  const elements = {};
  elements.nodes = [];
  elements.edges = [];
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    elements.nodes.push({ data: _.assign({ id: pathwayId }, pathwayInfoList[pathwayId]) })
  }
  const edgeInfo = generateEdgeInfo(pathwayIdList, JCWeight, cutoff);
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
