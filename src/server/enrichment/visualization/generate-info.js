const { pathwayListGraph } = require('./intersect');
const { filterEdges } = require('./intersect');
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


// generateEdgeInfo(pathwayIdList, JCWeight, cutoff) takes a list of pathway IDs,
// a weight for JCWeight and a number for cutoff point
// and returns the edge information for pathwayIdList where the similarity rate
// is calcaulated by JCWegith and filtered by cutoff
const generateEdgeInfo = (pathwayIdList, JCWeight, cutoff = 0.375) => {
  return filterEdges(pathwayListGraph(fetchPathwayInfo(pathwayIdList), JCWeight), cutoff);
};


// generateNodeInfo(pathwayIdList) takes a list of pathway IDs
// and returns the node information
const generateNodeInfo = (pathwayIdList) => {
  return fetchPathwayInfo(pathwayIdList);
};


module.exports = { generateEdgeInfo, generateNodeInfo };