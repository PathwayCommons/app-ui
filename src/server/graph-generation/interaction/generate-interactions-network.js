const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE } = require('../../../config');

let edgeTypeToLabel = type => {
  switch( type ){
    case 'in-complex-with':
    case 'interacts-with':
      return 'Binding';
    case 'controls-phosphorylation-of':
      return 'Phosphorylation';
    case 'controls-expression-of':
      return 'Expression';
    default:
      return '';
  }
};

let participantTxt2CyJson = (participantTxtLine, sourceIds) => {
  let parsedParticipantParts = participantTxtLine.split('\t');
  let name = parsedParticipantParts[0];
  let type = parsedParticipantParts[1];
  let uniprotId = parsedParticipantParts[3];

  return {
    data: {
      class: 'ball',
      id: name,
      label: name,
      queried: sourceIds.includes(name),
      metric: 0,
      metadata: { type, uniprotId }
    }
  };
};

let interactionTxt2CyJson = interactionTxtLine => {
  let parsedInteractionParts = interactionTxtLine.split('\t');
  let participant0 = parsedInteractionParts[0];
  let participant1 = parsedInteractionParts[2];
  let type = edgeTypeToLabel(parsedInteractionParts[1]);
  let pubmedIds = parsedInteractionParts[4];
  let pcEntityIds = parsedInteractionParts[6];
  let summary = `${participant0} ${type} ${participant1}`;

  return {
    data: {
      id: summary,
      label: summary,
      source: participant0,
      target: participant1,
      class: type,
      metadata: {
        publications: pubmedIds,
        pcLinks: pcEntityIds
      }
    },
    classes: type
  };
};

let sifText2CyJson = (sifText, sourceIds) => {
  let parsedParts = sifText.split('\n\n');
  let interactionsData = parsedParts[0].split('\n').slice(1);
  let participantsData = parsedParts[1].split('\n').slice(1);

  let nodeId2Json = {};
  let edges = [];

  participantsData.forEach( participantTxtLine => {
    let participantJson = participantTxt2CyJson( participantTxtLine, sourceIds );
    nodeId2Json[participantJson.data.id] = participantJson;
  } );

  interactionsData.forEach( interactionTxtLine => {
    let interactionJson = interactionTxt2CyJson( interactionTxtLine );
    let source = interactionJson.data.source;
    let target = interactionJson.data.target;

    let srcJson = nodeId2Json[source];
    let tgtJson = nodeId2Json[target];

    if( srcJson ){ srcJson.data.metric += 1 }
    if( tgtJson ){ tgtJson.data.metric += 1 }

    edges.push(interactionJson);
  } );

  return {
    nodes: Object.values(nodeId2Json),
    edges
  };
};

let filterByDegree = ( nodes, edges ) => {
  let filteredNodes = nodes.sort( (n0, n1) => {
    return n1.data.metric - n0.data.metric;
  } ).slice(0, 50);

  let filteredNodeIdMap = {};
  filteredNodes.forEach( node => filteredNodeIdMap[node.data.id] = true );

  let filteredEdges = edges.filter( edge => {
    let source = edge.data.source;
    let target = edge.data.target;

    // some edges may have a sorce or target filtered, we require both for
    // it to be a valid edge in the network json
    return filteredNodeIdMap[source] && filteredNodeIdMap[target];
  });

  return { nodes: filteredNodes, edges: filteredEdges };
};

let getInteractionsNetwork = sources => {
  let geneIds = _.uniq(_.concat([], sources)); //convert sources to array

  let params = {
    cmd: 'pc2/graph',
    source: geneIds,
    pattern: ['controls-phosphorylation-of','in-complex-with','controls-expression-of', 'interacts-with'],
    kind: geneIds.length > 1 ? 'pathsbetween' : 'neighborhood',
    format: 'txt'
  };

  //Fetch graph from PC
  return pc.query(params).then(res => {
    let { nodes, edges } = sifText2CyJson( res, geneIds );
    let filteredCyJson = filterByDegree( nodes, edges );

    return {
      network: filteredCyJson
    };
  }).catch( e => {
    logger.error( e );
    return 'ERROR: could not retrieve graph from PC';
  });
};

let pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

module.exports = { getInteractionsNetwork: cache(getInteractionsNetwork, pcCache) };