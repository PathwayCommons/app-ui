const _ = require('lodash');


// pathwayPairGraph(pathway1, pathway2, jaccardOverlapWeight) takes two pathway IDs
// pathway1 and pathway1 and a weight for Jaccard coefficient
// and generates the edge information between pathway1 and pathway2
const pathwayPairGraph = (pathway1, pathway2, jaccardOverlapWeight) => {
  let intersectionCount = 0;
  const intersection = [];
  const joinedPathway = pathway1.genes.concat(pathway2.genes);
  joinedPathway.sort();
  for (let i = 1; i < joinedPathway.length; ++i) {
    if (joinedPathway[i] === joinedPathway[i-1]) {
      ++intersectionCount;
      intersection.push(joinedPathway[i]);
    }
  }
  //similarity calculation
  const pathway1Length = pathway1.genes.length;
  const pathway2Length = pathway2.genes.length;
  const similarity = jaccardOverlapWeight * (intersectionCount / (pathway1Length + pathway2Length - intersectionCount)) + (1 - jaccardOverlapWeight) * (intersectionCount / Math.min(pathway1Length, pathway2Length));
  return {edgeId: pathway1.pathwayId + '_' + pathway2.pathwayId, intersection: intersection, similarity: similarity};
};


// pathwayListGraph(pathwayList, jaccardOverlapWeight) takes a list of pathway IDs pathwayList
// and a weight for Jaccard coefficient jaccardOverlapWeight
// and generates all edge informatino pairwise
const pathwayListGraph = (pathwayList, jaccardOverlapWeight) => {
  const ret = [];
  for (let i = 0; i < pathwayList.length; ++i) {
    for (let j = i + 1; j < pathwayList.length; ++j) {
      ret.push(pathwayPairGraph(pathwayList[i], pathwayList[j], jaccardOverlapWeight));
    }
  }
  return ret;
};


// filterEdges(edgeList, similarityCutoff) takes a list of edges edgelist and
// a number for cutoff point 'similarityCutoff'
// and filters edges whose similarity rate is less than similarityCutoff
const filterEdges = (edgeList, similarityCutoff) => {
  return _.filter(edgeList, edge => {
    return edge.similarity >= similarityCutoff;
  });
};


module.exports = { pathwayListGraph, filterEdges };