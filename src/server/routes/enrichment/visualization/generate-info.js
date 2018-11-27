const _ = require('lodash');

const { pathwayInfoTable } = require('./pathway-table');

// fetchPathwayInfo(pathwayList) takes a list of pathway identifiers pathwayList
// and returns the corresponding information for each pathway ID from
// pathwayInfoTable
const fetchPathwayInfo = (pathwayList) => {
  const ret = [];
  _.forEach(pathwayList, pathwayId => {
    ret.push({'pathwayId': pathwayId, 'description': pathwayInfoTable.get(pathwayId)['description'], 'genes': pathwayInfoTable.get(pathwayId)['geneset']});
  });
  return ret;
};

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

// generateEdgeInfo(pathwayInfo, jaccardOverlapWeight, similarityCutoff) takes a list of pathway IDs,
// a weight for jaccardOverlapWeight, and a number for similarityCutoff point
// and returns the edge information for pathwayIdList where the similarity rate
// is calcaulated by jaccardOverlapWeight and filtered by similarityCutoff
const generateEdgeInfo = (pathwayInfo, jaccardOverlapWeight, similarityCutoff = 0.375) => {
  return pathwayListGraph(pathwayInfo, jaccardOverlapWeight).filter( edge => edge.similarity >= similarityCutoff );
};


module.exports = { generateEdgeInfo, fetchPathwayInfo };