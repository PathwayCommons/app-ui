const _ = require('lodash');
const { pathwayInfoTable } = require('./pathway-table');

const createEnrichmentNetworkNode = pathwayInfo => {
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
};

// given two genelists, compute the intersection between them
const pathwayIntersection = ( p1Genes, p2Genes ) => {
  let intersection = [];
  let allGenes = p1Genes.concat(p2Genes).sort();

  for( let i = 1; i < allGenes.length; ++i ){
    if( allGenes[i] === allGenes[i-1] ){
      intersection.push(allGenes[i]);
    }
  }

  return intersection;
};

// pathwayPairGraph(geneset1, pathway2, jaccardOverlapWeight) takes two pathway IDs
// pathway1 and pathway1 and a weight for Jaccard coefficient
// and generates the edge information between pathway1 and pathway2
const createEnrichmentNetworkEdge = (pathway1, pathway2, jaccardOverlapWeight) => {
  let p1Genes = pathway1.geneSet;
  let p2Genes = pathway2.geneSet;
  let p1Id = pathway1.pathwayId;
  let p2Id = pathway2.pathwayId;
  let p1Length = p1Genes.length;
  let p2Length = p2Genes.length;

  let intersection = pathwayIntersection( p1Genes, p2Genes );
  let ilen = intersection.length;

  let similarity = jaccardOverlapWeight * (ilen / (p1Length + p2Length - ilen)) + (1 - jaccardOverlapWeight) * (ilen / Math.min(p1Length, p2Length));

  return {
    data: {
      id: p1Id + '_' + p2Id,
      source: p1Id,
      target: p2Id,
      intersection,
      similarity
    }
  };
};

// create an edge for each unique pair of pathways P1 and P2.  Filter them 'similarityCutoff'
const createEnrichmentNetworkEdges = (pathwayInfoList, jaccardOverlapWeight, similarityCutoff = 0.375) => {
  let edges = [];

  for (let i = 0; i < pathwayInfoList.length; ++i) {
    for (let j = i + 1; j < pathwayInfoList.length; ++j) {
      let edge = createEnrichmentNetworkEdge( pathwayInfoList[i], pathwayInfoList[j], jaccardOverlapWeight );
      let { data } = edge;
      let { similarity } = data;

      if( similarity >= similarityCutoff ){
        edges.push( edge );
      }
    }
  }

  return edges;
};

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

  // check unrecognized pathway ids and
  let unrecognized = new Set();
  let pathwayInfoList = [];
  Object.keys( pathways ).forEach( pathwayId => {
    let pathwayInfo = pathwayInfoTable.get( pathwayId );
    let intersection = _.get(pathways, `${pathwayId}.intersection`, []);

    if( pathwayInfo == null ){
      unrecognized.add(pathwayId);
    } else {
      pathwayInfoList.push( _.assign( pathwayInfo, { intersection } ) );
    }
  } );

  let nodes = pathwayInfoList.map( pathwayInfo => createEnrichmentNetworkNode( pathwayInfo ) );

  let edges = createEnrichmentNetworkEdges( pathwayInfoList, jaccardOverlapWeight, similarityCutoff );

  return { unrecognized: Array.from(unrecognized), graph: { elements: { nodes, edges } } };
};


module.exports = { generateEnrichmentNetworkJson };
