/*
documentation for emap
sample request URL: http://localhost:3000/api/emap/?pathwayIdList=GO:1901216 GO:2001252 GO:1905269
parameter:
pathwayIdList - [string] a list of pathwayIds (GO and REACTOME) delimited by whitespace
return:
[Object] {"unrecognized":[vector of pathwayIds], "duplicate": [vector of pathwayIds], "graph": [Object of node and edge info]}

Notes:
1. each pathwayId appears at most once in unrecognize, duplicate and geneInfo
2. If a pathwayId is unrecognized and duplicate, only report it in unrecognize.
3. If a pathwayId is recognized and duplicate, report it in duplicate and store info in graph.
*/
const pathwayInfoTable = require('./PathwayTable').pathwayInfoTable;
// const make_cytoscape = require('../../../../src/client/common/cy');
const generateNodeInfo = require('./generateInfo').generateNodeInfo;
const generateEdgeInfo = require('./generateInfo').generateEdgeInfo;
const _ = require('lodash');

// pathwayInfoList: {"GO:1":{pValue: 1}, "GO:2": {pValue: 0, color: "green"}}
const generateGraphInfo = (pathwayInfoList, cutoff = 0.375, JCWeight, OCWeight) => {
  if (cutoff < 0 || cutoff > 1) { throw new Error('ERROR: cutoff out of range [0, 1]'); }
  if (isNaN(Number(cutoff))) { throw new Error('ERROR: cutoff is not a number'); }

  if (JCWeight < 0 || JCWeight > 1) {
    throw new Error('ERROR: JCWeight out of range [0, 1]');
  }
  if (OCWeight < 0 || OCWeight > 1) {
    throw new Error('ERROR: OCWeight out of range [0, 1]');
  }
  if (JCWeight != undefined && isNaN(Number(JCWeight))) { throw new Error('ERROR: JCWeight should be a number'); }
  if (OCWeight != undefined && isNaN(Number(OCWeight))) { throw new Error('ERROR: OCWeight should be a number'); }
  if (OCWeight != undefined && JCWeight != undefined && Number(OCWeight) + Number(JCWeight) != 1) {
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
  const unrecognized = [];
  console.log(pathwayInfoList);
  console.log(typeof(pathwayInfoList));
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    //console.log(pathwayId);
    if (!pathwayInfoTable.has(pathwayId)) {
      if (_.filter(unrecognized, elem => elem === pathwayId).length === 0) {
        unrecognized.push(pathwayId);
      }
      delete pathwayInfoList[pathwayId];
    } else if (pathwayInfoList[pathwayId].hasOwnProperty('pathwayId')) {
      throw new Error('ERROR: additional info for ' + pathwayId + ' can not have pathwayId field');
    }
  }
  const pathwayIdList = [];
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    pathwayIdList.push(pathwayId);
  }
  // generate node and edge info
  const elements = [];
  for (let pathwayId in pathwayInfoList) {
    if (!pathwayInfoList.hasOwnProperty(pathwayId)) continue;
    elements.push({ data: _.assign({ id: pathwayId }, pathwayInfoList[pathwayId]) })
  }
  const edgeInfo = generateEdgeInfo(pathwayIdList, JCWeight, cutoff);
  _.forEach(edgeInfo, edge => {
    const sourceIndex = 0;
    const targetIndex = 1;
    const source = edge.edgeId.split('_')[sourceIndex];
    const target = edge.edgeId.split('_')[targetIndex];
    elements.push({
      data: {
        id: edge.edgeId,
        source: source,
        target: target,
        similarity: edge.similarity,
        intersection: edge.intersection
      }
    });
  });

  return { unrecognized: unrecognized, graph: elements };

};


module.exports = { generateGraphInfo };
