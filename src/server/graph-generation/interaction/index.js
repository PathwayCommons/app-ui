const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE } = require('../../../config');

function edgeType(type) {
  switch(type){
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
}

function rawGetInteractionGraphFromPC(interactionIDs){
  const geneIds = _.uniq(_.concat([], interactionIDs)); //convert sources to array

  const params = {
    cmd : 'pc2/graph',
    source : geneIds,
    pattern : ['controls-phosphorylation-of','in-complex-with','controls-expression-of', 'interacts-with'],
    kind : geneIds.length > 1 ? 'pathsbetween' : 'neighborhood',
    format : 'txt'
  };

  //Fetch graph from PC
  return pc.query(params).then(res => {
    
    let parsedNetwork = parse(res,geneIds);
    //avoids errors in addMetricandFilter, return empty network
    if(_.isEmpty(parsedNetwork))
      return {};

    let filteredNetwork = addMetricAndFilter(parsedNetwork.nodes, parsedNetwork.edges);
    return {network: filteredNetwork};
  }).catch((e)=>{
    logger.error(e);
    return 'ERROR : could not retrieve graph from PC';
  });
}

const pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

const getInteractionGraphFromPC = cache(rawGetInteractionGraphFromPC, pcCache);

/**
 * Parse the PC TXT (aka extended SIF) format to JSON
 * @param {string} data graph in txt format
 * @param {String[]} Array of query Ids
 * @return {json} JSON of graph
 */
function parse(data, queryIDs){
  let edgeList = [];
  let nodeList =new Map(); //maps node id to node (to avoid duplicate entries)

  if(data){
    const dataSplit=data.split('\n\n');
    const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
    dataSplit[0].split('\n').slice(1).forEach(line => {
      const splitLine=line.split('\t');
      const edgeMetadata = interactionMetadata(splitLine[6],splitLine[4]);
      addInteraction([splitLine[0], splitLine[2]], splitLine[1], nodeList, edgeList, nodeMetadata, edgeMetadata, queryIDs);
    });

    //return network
    return {nodes: nodeList, edges: edgeList};
  }
  return {};
}

/**
 * 
 * @param {*} network JSON containing nodes and edges that represent a network
 * @returns A network JSON with 50 nodes, sorted based on degree
 * @description The network is filtered down to the 50 nodes with largest degree.
 */
function addMetricAndFilter(nodes,edges){
  
  //converts the node map into an array, sorts by degree, converts back to map
  const filteredNodes = new Map(
    [...nodes.entries()].sort( (a, b) => {
      return b[1].data.metric - a[1].data.metric;
    }).slice(0,50)
  );

  //if the filtered node map has the source and target of the edge, add it to the return network
  //if edges aren't filtered get some serious cytoscape errors later on
  const filteredEdges = [];
  edges.forEach( edge => {
    const source = edge.data.source;
    const target = edge.data.target;
    if(filteredNodes.has(source) && filteredNodes.has(target))
      filteredEdges.push(edge);
  });


  return { nodes:[...filteredNodes.values()], edges:filteredEdges };
}

function interactionMetadata(mediatorIds, pubmedIds){
  let metadata = [['List',[]],['Detailed Views',[]]];//Format expected by format-content
  mediatorIds.split(';').forEach( link => {
    const id=link.split('/')[4];
    metadata[1][1].push(link.includes('reactome') ? ['Reactome',id]:['Pathway Commons',id]);
  });
  if(pubmedIds){
   pubmedIds.split(';').forEach(id=>metadata[0][1].push(['PubMed',id]));
  }
 return metadata;
}

function addInteraction(nodes, edge, nodeList, edgeList, nodeMetadata, edgeMetadata, queryIDs){
  const interaction= edgeType(edge);
  const networkEdgeData = {data: {
    id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
    label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
    source: nodes[0],
    target: nodes[1],
    class: interaction,
    parsedMetadata:edgeMetadata
  },classes:interaction};
  edgeList.push(networkEdgeData);
  
  nodes.forEach((node)=>{
    if(!nodeList.has(node)){
      const metadata=nodeMetadata.get(node);
      const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');
      const networkNodeData = {data:{
        class: "ball",
        id: node,
        label: node,
        queried: queryIDs.indexOf(node) != -1,
        metric: 1,
        parsedMetadata:[
          ['Type',
          'bp:'+metadata[0].split(' ')[0].replace(/Reference/g,'').replace(/;/g,',')],
          ['Database IDs', links]
        ]
      }};
      nodeList.set(node,networkNodeData);
    }
    else {
      //metric is degree
      let nodeUpdate = nodeList.get(node);
      nodeUpdate.data['metric'] = nodeUpdate.data.metric + 1;
      nodeList.set(node, nodeUpdate);
    }
  });
}

module.exports = {getInteractionGraphFromPC};