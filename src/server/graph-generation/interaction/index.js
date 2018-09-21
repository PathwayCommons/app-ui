const _ = require('lodash');
const LRUCache = require('lru-cache');

const pc = require('../../pathway-commons');
const logger = require('../../logger');
const cache = require('../../cache');
const ncbi = require('../../external-services/ncbi');

const { PC_CACHE_MAX_SIZE, MAX_SIF_NODES } = require('../../../config');
const Datasources = require('../../../models/datasources');



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

let interactionTxt2CyJson = (srcId, tgtId, type, providersString, pubmedIdsString, pathwayNamesString, mediatorIdsString ) => {
  let summary = type === 'catalysis-precedes' ? `${srcId} and ${tgtId} in catalysis` : `${srcId} ${type.split('-').join(' ')} ${tgtId}`;
  let readableType = interactionType2Label(type);
  let splitBySemi = (input) => (input || '').split(';').filter(entry => !_.isEmpty(entry));
  let datasources = splitBySemi( providersString ).map( datasource => Datasources.findByKey( datasource ).name ).filter( name => name != null );
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

let sifText2CyJson = (sifText, sourceIds) => {
  let interactionsData = sifText.split('\n');

  let nodeId2Json = {};
  let edges = [];

  interactionsData.forEach( interactionTxtLine => {
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

    let interactionJson = interactionTxt2CyJson( srcId, tgtId, type, providersString, pubMedIdsString, pathwayNamesString, mediatorIdsString );
    srcJson.data.metric += 1;
    tgtJson.data.metric += 1;

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

// let addNetworkPublications = network => {
//   let pubmedIds = _.uniq((() => {
//     let ids = [];

//     network.edges.forEach(edge => {
//       edge.data.pubmedIds.forEach(id => ids.push(id));
//     });

//     return ids;
//   })());

//   let getPubs = () => ncbi.getPublications(pubmedIds);
//   console.log('here');

//   let pubMap = new Map();

//   let putPubsInMap = pubs => pubs.forEach(pub => pubMap.set(pub.id, pub));

//   let putFromMapToEdges = () => {
//     network.edges.forEach(edge => {
//       let { data } = edge;

//       data.pubmedEntries = data.pubmedIds.map(id => pubMap.get(id)).filter();
//     });
//   };

//   return (
//     Promise.resolve()
//     .then(getPubs)
//     .then(putPubsInMap)
//     .then(putFromMapToEdges)
//     .then(() => network)
//   );
// };

let getInteractionsNetwork = sources => {
  let uniqueGeneIds  = _.uniq([].concat(sources).map( source => source.toUpperCase() ) );

  let params = {
    source: uniqueGeneIds
  };

  return pc.sifGraph( params ).then( res => {
    return getInteractionsCyJson(res, uniqueGeneIds);
  // }).then(network => {
  //   // return addNetworkPublications(network);
  }).then(network => {
    return { network };
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