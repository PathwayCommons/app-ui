const _ = require('lodash');

const { pathwayListGraph, filterEdges } = require('./intersect');
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


// generateEdgeInfo(pathwayInfo, jaccardOverlapWeight, similarityCutoff) takes a list of pathway IDs,
// a weight for jaccardOverlapWeight, and a number for similarityCutoff point
// and returns the edge information for pathwayIdList where the similarity rate
// is calcaulated by jaccardOverlapWeight and filtered by similarityCutoff
const generateEdgeInfo = (pathwayInfo, jaccardOverlapWeight, similarityCutoff = 0.375) => {
  return filterEdges(pathwayListGraph(pathwayInfo, jaccardOverlapWeight), similarityCutoff);
};


module.exports = { generateEdgeInfo, fetchPathwayInfo };