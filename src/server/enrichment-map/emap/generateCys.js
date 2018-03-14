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


// input ["GO:1902275", "GO:2001252", "GO:1905269", "GO:0051053"]
// returns a cytoscape object
const generateCys = (pathwayIdList) => {
  // check unrecognized and duplicates, modify pathwayIdList
  const unrecognized = [];
  const duplicate = [];
  for (let i = 0; i < pathwayIdList.length; ++i) {
    const pathwayId = pathwayIdList[i];
    if (!pathwayInfoTable.has(pathwayId)) {
      if (_.filter(unrecognized, elem => elem === pathwayId).length === 0) {
        unrecognized.push(pathwayId);
      }
      pathwayIdList.splice(pathwayIdList.indexOf(pathwayId), 1);
      --i;
    }
  }
  for (let i = 0; i < pathwayIdList.length; ++i) {
    const pathwayId = pathwayIdList[i];
    if ((_.filter(pathwayIdList, ele => ele === pathwayId)).length > 1) {
      if (_.filter(duplicate, ele => ele === pathwayId).length == 0) {
        duplicate.push(pathwayId);
      } else {
        pathwayIdList.splice(pathwayIdList.indexOf(pathwayId), 1);
        --i;
      }
    }
  }
  // generate node and edge info
  const cy = {};
  cy.node = [];
  cy.edge = [];
  const nodeInfo = generateNodeInfo(pathwayIdList);
  _.forEach(nodeInfo, node => {
    cy.node.push(node.pathwayId);
    // cy.add({
    //   data: { id: node.pathwayId }
    // });
  });
  const edgeInfo = generateEdgeInfo(pathwayIdList);
  _.forEach(edgeInfo, edge => {
    const sourceIndex = 0;
    const targetIndex = 1;
    const source = edge.edgeId.split('_')[sourceIndex];
    const target = edge.edgeId.split('_')[targetIndex];
    // cy.add({
    //   data: {
    //     id: edge.edgeId,
    //     source: source,
    //     target: target,
    //     similarity: edge.similarity,
    //     intersection: edge.intersection
    //   }
    // });
    cy.edge.push({
      id: edge.edgeId,
      source: source,
      target: target,
      similarity: edge.similarity,
      intersection: edge.intersection
    });
  });
  return { unrecognized: unrecognized, duplicate: duplicate, graph: cy };
};


module.exports = { generateCys };

//simple testing
//console.log(generateCys(["GO:1902275", "GO:2001252", "GO:1905269"]));
// const result = generateCys(["GO:1902275", "GO:2001252", "GO:1905269"]);
// console.log(JSON.stringify(result));