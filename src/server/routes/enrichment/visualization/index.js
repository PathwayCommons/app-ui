const _ = require('lodash');

const { pathwayInfoTable } = require('./pathway-table');
const logger = require('../../../logger');
const { NS_GENE_ONTOLOGY, NS_REACTOME } = require('../../../../config');
const { xref2Uri } = require('../../../external-services/pathway-commons');

const isGOId = token => /^GO:\d+$/.test( token );
const isReactomeId = token => /^R-HSA-\d+$/.test( token );
const normalizeId = pathwayId => pathwayId.replace('REAC:', '');
const getXref = id => {
  let name;
  if( isGOId( id ) ){
    name = NS_GENE_ONTOLOGY;
  } else if ( isReactomeId( id ) ) {
    name = NS_REACTOME;
  }
  return xref2Uri( name, id );
};

const createEnrichmentNetworkNode = pathwayInfo => {
  let { pathwayId, geneSet, name, intersection } = pathwayInfo;

  const node = {
    data: {
      id: pathwayId,
      intersection,
      geneCount: geneSet.length,
      geneSet,
      name
    }
  };

  return Promise.resolve( normalizeId( pathwayId ) )
    .then( getXref )
    .then( ({ uri, namespace }) => _.assign( node.data, { uri, namespace } ) )
    .catch( error => {
      logger.error(`Error in createEnrichmentNetworkNode - ${error}`);
      throw error;
    });
};

// given two genelists, compute the intersection between them
const pathwayIntersection = ( p1Genes, p2Genes ) => {
  let s = new Set(p1Genes);

  let intersection = [... new Set( p2Genes.filter( gene => s.has( gene ) ) ) ];

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
// an edge is created when the similarity of pathways P1 and P2 is greated than the defined threshold 'similarityCutoff'
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
const generateEnrichmentNetworkJson = async (pathways, similarityCutoff = 0.375, jaccardOverlapWeight = 0.5) => {
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

  let nodePromises = pathwayInfoList.map( async pathwayInfo =>  await createEnrichmentNetworkNode( pathwayInfo ) );
  const nodes = await Promise.all( nodePromises );

  let edges = createEnrichmentNetworkEdges( pathwayInfoList, jaccardOverlapWeight, similarityCutoff );

  return { unrecognized: Array.from(unrecognized), graph: { elements: { nodes, edges } } };
};


module.exports = { generateEnrichmentNetworkJson };
