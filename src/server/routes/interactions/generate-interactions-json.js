const _ = require('lodash');
const QuickLRU = require('quick-lru');

const pc = require('../../external-services/pathway-commons');
const { cachePromise } = require('../../cache');
// const ncbi = require('../../external-services/ncbi');

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

let participantTxt2CyJson = ( id, sourceIds ) => {
  let isQueried = sourceIds.includes(id);

  return {
    data: {
      class: 'ball',
      id,
      queried: isQueried,
      metric: isQueried ? Number.MAX_SAFE_INTEGER : 0
    }
  };
};

let interactionTxt2CyJson = async (srcId, tgtId, type, providersString, pubmedIdsString, pathwayNamesString, mediatorIdsString ) => {
  let summary = type === 'catalysis-precedes' ? `${srcId} and ${tgtId} in catalysis` : `${srcId} ${type.split('-').join(' ')} ${tgtId}`;
  let readableType = interactionType2Label(type);
  let splitBySemi = (input) => (input || '').split(';').filter(entry => !_.isEmpty(entry));
  let supportedProviders = await pc.getDataSources();
  let datasources = splitBySemi( providersString )
    .map( provider =>  supportedProviders.find( supportedProvider => supportedProvider.alias.some( alias => alias === provider ) ) )
    .map( supportedProvider => _.get( supportedProvider, 'name' ) );
  let pubmedIds = splitBySemi( pubmedIdsString );
  let pathwayNames = splitBySemi( pathwayNamesString );
  let mediatorIds = splitBySemi( mediatorIdsString );
  let pcIds = mediatorIds.filter( id => !id.toUpperCase().includes('REACTOME'));

  return {
    data: {
      id: summary,
      type,
      source: srcId,
      target: tgtId,
      datasources,
      pubmedIds,
      pathwayNames,
      pcIds
    },
    classes: readableType
  };
};

let sifText2CyJson = async (sifText, sourceIds) => {
  let interactionsData = sifText.split('\n');

  let nodeId2Json = {};
  let edges = [];

  const interactionsDataPromises = interactionsData.map( async interactionTxtLine => {
    let parsedInteractionParts = interactionTxtLine.split('\t');
    let [srcId, type, tgtId, providersString, pubMedIdsString, pathwayNamesString, mediatorIdsString] = parsedInteractionParts;

    if( _.isEmpty(srcId) || _.isEmpty(tgtId) ){ return; }

    let srcJson = nodeId2Json[ srcId ];
    let tgtJson = nodeId2Json[ tgtId ];
    if( nodeId2Json[ srcId ] == null ){
      srcJson = nodeId2Json[ srcId ] = participantTxt2CyJson( srcId, sourceIds );
    }

    if( nodeId2Json[ tgtId ] == null ){
      tgtJson = nodeId2Json[ tgtId ] = participantTxt2CyJson( tgtId, sourceIds );
    }

    let interactionJson = await interactionTxt2CyJson( srcId, tgtId, type, providersString, pubMedIdsString, pathwayNamesString, mediatorIdsString );
    srcJson.data.metric += 1;
    tgtJson.data.metric += 1;

    edges.push(interactionJson);
  });

  await Promise.all( interactionsDataPromises );

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

let getInteractionsCyJson = async (sifText, geneIds) => {
  let { nodes, edges } = await sifText2CyJson( sifText, geneIds );
  let filteredCyJson = filterByDegree( nodes, edges );
  return filteredCyJson;
};

let getInteractionsNetwork = sources => {
  let uniqueGeneIds  = _.uniq([].concat(sources).map( source => source.toUpperCase() ) );

  let params = {
    source: uniqueGeneIds
  };

  return pc.sifGraph( params ).then( res => getInteractionsCyJson(res, uniqueGeneIds) );
};

let pcCache = new QuickLRU({ maxSize: PC_CACHE_MAX_SIZE });

module.exports = {
  sifText2CyJson,
  getInteractionsCyJson,
  getInteractionGraphFromPC: cachePromise(getInteractionsNetwork, pcCache)
};