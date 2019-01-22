const _ = require('lodash');

const { TimeoutError } = require('../../../../util');
const logger = require('../../../logger');
const { IDENTIFIERS_URL, NS_GENE_ONTOLOGY, NS_REACTOME } = require('../../../../config');
const { xref2Uri } = require('../../../external-services/pathway-commons');

const isGOId = token => /^GO:\d+$/.test( token );
const isReactomeId = token => /^R-HSA-\d+$/.test( token );
const normalizeId = pathwayId => pathwayId.replace('REAC:', '');

const reThrow = error => { throw error; };
const fallbackXref = ( namespace, record ) => ({ uri: IDENTIFIERS_URL + '/' + namespace + '/' + record, namespace });

const getXref = id => {
  let name;

  if( isGOId( id ) ){
    name = NS_GENE_ONTOLOGY;
  } else if ( isReactomeId( id ) ) {
    name = NS_REACTOME;
  }
  // Try the service. Fallback to manually constructing xref if TimeoutError
  return xref2Uri( name, id )
      .catch( error => error instanceof TimeoutError ? fallbackXref( name, id ): reThrow( error ) );
};

const createEnrichmentNetworkNode = pathway => {
  let { id, geneSet } = pathway;
  const geneCount = geneSet.length;

  const node = {
    data: _.assign( pathway, { geneCount })
  };

  return Promise.resolve( normalizeId( id ) )
    .then( getXref )
    .then( xref => {
      _.assign( node.data, xref );
      return node;
    })
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
  let p1Id = pathway1.id;
  let p2Id = pathway2.id;
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
const createEnrichmentNetworkEdges = ( pathwayList, jaccardOverlapWeight = 0.5, similarityCutoff = 0.6 ) => {
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

  let edges = [];
  for (let i = 0; i < pathwayList.length; ++i) {
    for (let j = i + 1; j < pathwayList.length; ++j) {
      let edge = createEnrichmentNetworkEdge( pathwayList[i], pathwayList[j], jaccardOverlapWeight );
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
const generateEnrichmentNetworkJson = async (pathwayInfoTable, pathways, similarityCutoff, jaccardOverlapWeight) => {

  // check unrecognized pathway ids and
  let unrecognized = new Set();
  let pathwayList = [];
  pathways.forEach( pathway => {
    let pathwayInfo = pathwayInfoTable.get( pathway.id );
    if( pathwayInfo == null ){
      unrecognized.add( pathway.id );
    } else {
      pathwayList.push( _.assign( {}, pathwayInfo, pathway.data ) );
    }
  });

  let nodePromises = pathwayList.map( async pathway =>  await createEnrichmentNetworkNode( pathway ) );
  let nodes = await Promise.all( nodePromises );
  let edges = createEnrichmentNetworkEdges( pathwayList, jaccardOverlapWeight, similarityCutoff );

  return { unrecognized: Array.from(unrecognized), graph: { elements: { nodes, edges } } };

};


module.exports = { generateEnrichmentNetworkJson };