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
    edgeId: p1Id + '_' + p2Id,
    source: p1Id,
    target: p2Id,
    intersection,
    similarity
  };
};

// generateEdgeInfo(pathwayInfo, jaccardOverlapWeight, similarityCutoff) takes a list of pathway IDs,
// a weight for jaccardOverlapWeight, and a number for similarityCutoff point
// and returns the edge information for pathwayIdList where the similarity rate
// is calcaulated by jaccardOverlapWeight and filtered by similarityCutoff
const generateEdgeInfo = (pathwayInfoList, jaccardOverlapWeight, similarityCutoff = 0.375) => {
  let edges = [];

  for (let i = 0; i < pathwayInfoList.length; ++i) {
    for (let j = i + 1; j < pathwayInfoList.length; ++j) {
      let edge = createEnrichmentNetworkEdge( pathwayInfoList[i], pathwayInfoList[j], jaccardOverlapWeight );
      let { similarity } = edge;

      if( similarity >= similarityCutoff ){
        edges.push( edge );
      }
    }
  }

  return edges;
};


module.exports = { generateEdgeInfo };