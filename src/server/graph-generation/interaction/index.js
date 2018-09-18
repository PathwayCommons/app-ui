const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE, MAX_SIF_NODES } = require('../../../config');

let interactionType2Label = type => {
  switch( type ){
    case 'interacts-with':
      return 'Binding';
    case 'controls-state-change-of':
    case 'controls-phosphorylation-of':
      return 'Modification';
    case 'controls-expression-of':
      return 'Expression';
    case 'controls-transport-of':
    case 'catalysis-precedes':
      return 'Other';
    default:
      return '';
  }
};

let participantTxt2CyJson = ( parsedInteractionParts, sourceIds ) => {
  let sourceName = parsedInteractionParts[0] || '';
  let targetName = parsedInteractionParts[2] || '';
  let isSourceQueried = sourceIds.includes(sourceName);
  let isTargetQueried = sourceIds.includes(targetName);
  return [
    {
      data: {
        class: 'ball',
        id: sourceName,
        queried: isSourceQueried,
        metric: isSourceQueried ? Number.MAX_SAFE_INTEGER : 0
      }
    },
    {
      data: {
        class: 'ball',
        id: targetName,
        queried: isTargetQueried,
        metric: isTargetQueried ? Number.MAX_SAFE_INTEGER : 0
      }
    }
  ];
};

let interactionTxt2CyJson = parsedInteractionParts => {
  let participant0 = parsedInteractionParts[0];
  let participant1 = parsedInteractionParts[2];
  let type = parsedInteractionParts[1];
  let summary = type === 'catalysis-precedes' ? `${participant0} and ${participant1} in catalysis` : `${participant0} ${type.split('-').join(' ')} ${participant1}`;
  let readableType = interactionType2Label(type);
  let pubmedIds = ( parsedInteractionParts[4] || '').split(';');
  let mediatorIds = ( parsedInteractionParts[6] || '').split(';');
  let pcIds = mediatorIds.filter( id => !id.toUpperCase().includes('REACTOME'));
  let reactomeIds = mediatorIds.filter( id => id.toUpperCase().includes('REACTOME'));

  return {
    data: {
      id: summary,
      type,
      source: participant0,
      target: participant1,
      pubmedIds,
      pcIds,
      reactomeIds
    },
    classes: readableType
  };
};

let sifText2CyJson = (sifText, sourceIds) => {
  let interactionsData = sifText.split('\n');

  let nodeId2Json = {};
  let edges = [];

  interactionsData.forEach( interactionTxtLine => {
    if ( !interactionTxtLine.length ) return;
    let parsedInteractionParts = interactionTxtLine.split('\t');

    let participantsJson = participantTxt2CyJson( parsedInteractionParts, sourceIds );
    participantsJson.forEach( participant => {
      if ( !_.has(nodeId2Json, participant.data.id ) ) nodeId2Json[participant.data.id] = participant;
    });

    let interactionJson = interactionTxt2CyJson( parsedInteractionParts );

    let source = interactionJson.data.source;
    let target = interactionJson.data.target;

    let srcJson = nodeId2Json[source];
    let tgtJson = nodeId2Json[target];

    if( srcJson ){ srcJson.data.metric += 1; }
    if( tgtJson ){ tgtJson.data.metric += 1; }

    edges.push(interactionJson);

  } );

  return {
    nodes: Object.values(nodeId2Json),
    edges
  };
};

let filterByDegree = (nodes, edges) => {
  // take 50 nodes with the highest degree
  // filter all nodes with degree 0
  let filteredNodes = nodes.sort( (n0, n1) => {
    return n1.data.metric - n0.data.metric;
  } ).slice(0, MAX_SIF_NODES).filter( n => n.data.metric !== 0 );

  let filteredNodeIdMap = {};
  filteredNodes.forEach( node => filteredNodeIdMap[node.data.id] = true );

  // filter edges that still have their source/target in the filtered node set
  let filteredEdges = edges.filter( edge => {
    let source = edge.data.source;
    let target = edge.data.target;

    // some edges may have a sorce or target filtered, we require both for
    // it to be a valid edge in the network json
    return filteredNodeIdMap[source] && filteredNodeIdMap[target];
  });

  return { nodes: filteredNodes, edges: filteredEdges };
};

let getInteractionsCyJson = (sifText, geneIds) => {
  let { nodes, edges } = sifText2CyJson( sifText, geneIds );
  let filteredCyJson = filterByDegree( nodes, edges );

  return filteredCyJson;
};

let getInteractionsNetwork = sources => {
  let uniqueGeneIds  = _.uniq([].concat(sources).map( source => source.toUpperCase() ) );

  let params = {
    source: uniqueGeneIds
  };

  return pc.sifGraph( params ).then( res => {
    return {
      network: getInteractionsCyJson(res, uniqueGeneIds)
    };
  }).catch( e => {
    logger.error( e );
    throw e;
  });
};

let pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

module.exports = {
  sifText2CyJson,
  getInteractionsCyJson,
  getInteractionGraphFromPC: cache(getInteractionsNetwork, pcCache)
};