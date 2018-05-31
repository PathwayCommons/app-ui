const { pathwayInfoTable } = require('./pathway-table');
const { generateEdgeInfo } = require('./generate-info');
const _ = require('lodash');


// generateGraphInfo(pathwayInfoList, cutoff = 0.375, jaccardOverlapWeight) takes a
// list of pathway information 'pathwayInfoList', a number for cutoff point 'cutoff'
// and the weight for Jaccard coefficient 'jaccardOverlapWeight'
// and returns the graph information for pathwayInfoList based on 'cutoff' and 'jaccardOverlapWeight'
const generateGraphInfo = (pathwayInfoList, cutoff = 0.375, jaccardOverlapWeight) => {
  if (cutoff < 0 || cutoff > 1) {
    throw new Error('ERROR: cutoff out of range [0, 1]');
  }
  if (typeof(cutoff) != 'number') {
    throw new Error('ERROR: cutoff is not a number');
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
    elements.nodes.push({ data: _.assign({ id: pathwayId }, pathwayInfoList[pathwayId]) });
  }
  const edgeInfo = generateEdgeInfo(pathwayIdList, jaccardOverlapWeight, cutoff);
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
