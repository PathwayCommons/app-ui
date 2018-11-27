const _ = require('lodash');
const { pathwayInfoTable } = require('./pathway-table');
const { generateEdgeInfo } = require('./generate-info');



// generate cytoscape.js compatible network JSON for enrichment
const generateEnrichmentNetworkJson = (pathways, similarityCutoff = 0.375, jaccardOverlapWeight = 0.5) => {
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

  // check unrecognized and duplicates, modify pathwayIdList
  let unrecognized = new Set();
  let pathwayInfoList = [];
  Object.keys( pathways ).forEach( pathwayId => {
    let pathwayInfo = pathwayInfoTable.get( pathwayId );

    if( pathwayInfo == null ){
      unrecognized.add(pathwayId);
    } else {
      pathwayInfoList.push( _.assign( pathwayInfo, { intersection: pathways[ pathwayId ].intersection } ) );
    }
  } );

  let nodes = pathwayInfoList.map( pathwayInfo => {
    let { pathwayId, geneSet, description, intersection } = pathwayInfo;

    return {
      data: {
        id: pathwayId,
        intersection,
        geneCount: geneSet.length,
        geneSet,
        description
      }
    };
  } );

  let edges = generateEdgeInfo(pathwayInfoList, jaccardOverlapWeight, similarityCutoff).map( edge => {
    let { edgeId, source, target, similarity, intersection } = edge;

    return {
      data: {
        id: edgeId,
        source,
        target,
        similarity,
        intersection
      }
    };
  });

  return { unrecognized: Array.from(unrecognized), graph: { elements: { nodes, edges } } };
};


module.exports = { generateEnrichmentNetworkJson };
