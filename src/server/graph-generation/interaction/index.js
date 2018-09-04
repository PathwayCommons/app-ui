const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE } = require('../../../config');

let participantType2Label = type => {
  switch( type ){
    case 'interacts-with':
      return 'Binding';
    case 'controls-state-change-of':
    case 'controls-phosphorylation-of':
      return 'Phosphorylation etc.';
    case 'controls-expression-of':
      return 'Expression';
    case 'controls-transport-of':
    case 'catalysis-precedes':
      return 'Other';
    default:
      return '';
  }
};

let participantTxt2CyJson = (participantTxtLine, sourceIds) => {
  let parsedParticipantParts = participantTxtLine.split('\t');
  let name = parsedParticipantParts[0] || '';
  let types = parsedParticipantParts[1] || '';
  let unificationXrefs = parsedParticipantParts[3] || '';
  let relationshipXrefs = parsedParticipantParts[4] || '';
  let parsedTypes = types.replace(/Reference/g, '').split(';');

  let externalIds = {};
  unificationXrefs.split(';').forEach( uniXref => {
    let [externalDb, externalDbId] = uniXref.split(':');
    externalIds[externalDb] = externalDbId;
  });

  relationshipXrefs.split(';').forEach( relXref => {
    let [externalDb, externalDbId] = relXref.split(':');
    externalIds[externalDb] = externalDbId;
  });

  return {
    data: {
      class: 'ball',
      id: name,
      queried: sourceIds.includes(name),
      metric: 0,
      types: parsedTypes,
      externalIds
    }
  };
};

let interactionTxt2CyJson = interactionTxtLine => {
  let parsedInteractionParts = interactionTxtLine.split('\t');
  let participant0 = parsedInteractionParts[0];
  let participant1 = parsedInteractionParts[2];
  let type = parsedInteractionParts[1];
  let summary = `${participant0} ${type.split('-').join(' ')} ${participant1}`;
  let readableType = participantType2Label(parsedInteractionParts[1]);
  let pubmedIds = ( parsedInteractionParts[4] || '').split(';');
  let mediatorIds = ( parsedInteractionParts[6] || '').split(';');
  let pcIds = mediatorIds.filter( id => !id.toUpperCase().includes('REACTOME'));
  let reactomeIds = mediatorIds.filter( id => id.toUpperCase().includes('REACTOME'));

  return {
    data: {
      id: summary,
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

let getInteractionsCyJson = (sifText, geneIds) => {
  let { nodes, edges } = sifText2CyJson( sifText, geneIds );
  let filteredCyJson = filterByDegree( nodes, edges );

  return filteredCyJson;
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
    return {
      network: getInteractionsCyJson(res, geneIds)
    };
  }).catch( e => {
    logger.error( e );
    return 'ERROR: could not retrieve graph from PC';
  });
};

let pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

module.exports = {
  sifText2CyJson,
  getInteractionsCyJson,
  getInteractionGraphFromPC: cache(getInteractionsNetwork, pcCache)
};