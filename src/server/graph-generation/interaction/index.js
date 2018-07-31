const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');
const LRUCache = require('lru-cache');
const cache = require('../../cache');
const { PC_CACHE_MAX_SIZE } = require('../../../config');
const cytoscape = require('cytoscape');

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
    cmd : 'graph',
    source : geneIds,
    pattern : ['controls-phosphorylation-of','in-complex-with','controls-expression-of', 'interacts-with'],
    kind : geneIds.length > 1 ? 'pathsbetween' : 'neighborhood',
    format : 'txt'
  };

  //Fetch graph from PC
  return pc.query(params).then(res => {
    
    console.time('parse');
    let parsedNetwork = parse(res,geneIds);
    console.timeEnd('parse');

    console.time('total');
    let filteredNetwork = addMetricandFilter(parsedNetwork.network, parsedNetwork.nodeDegrees);
    console.timeEnd('total');

    return {network: filteredNetwork};
  }).catch((e)=>{
    logger.error(e);
    return 'ERROR : could not retrieve graph from PC';
  });
}

const pcCache = LRUCache({ max: PC_CACHE_MAX_SIZE, length: () => 1 });

const getInteractionGraphFromPC = cache(rawGetInteractionGraphFromPC, pcCache);

/**
 * Parse txt format to Json
 * @param {string} data graph in txt format
 * @param {String[]} Array of query Ids
 * @return {json} JSON of graph
 */
function parse(data, queryIds){
  let network = {
    edges:[],
    nodes:[],
  };
  let nodeDegreeMap =new Map(); //keeps track of nodes that have already been added, also calculates node degree
  if(data){
    const dataSplit=data.split('\n\n');
    const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
    dataSplit[0].split('\n').slice(1).forEach(line => {
      const splitLine=line.split('\t');
      const edgeMetadata = interactionMetadata(splitLine[6],splitLine[4]);
      addInteraction([splitLine[0], splitLine[2]], splitLine[1], edgeMetadata, network, nodeDegreeMap, nodeMetadata, queryIds);
    });
    return {network: network, nodeDegrees:nodeDegreeMap};
  }
  return {};
}

/**
 * 
 * @param {*} network JSON containing nodes and edges that represent a network
 * @returns A network JSON with 50 nodes, sorted based on centrality & degree
 * @description Each node in the network is assigned a `degree` metric, and the network is filtered down to the 100 nodes with largest degree.
 * The remaining 100 nodes are assigned a `betweenness centrality (BC)` metric, and the network is filtered down to the 50 nodes with largest BC.
 */
function addMetricandFilter(network,nodeDegrees){
  const nodes = network.nodes;
  const edges = network.edges;

  console.time("Sort/Filter Nodes");
  //sort nodes by degree
  let sortedNodes = nodes.sort( (a,b) => {
    return nodeDegrees.get(b.data.id).length - nodeDegrees.get(a.data.id).length; 
  });

  //keep the 100 nodes with the largest degree
  let filteredNodes = sortedNodes.slice(0,50);
  filteredNodes.forEach( node => {
    node.data['metric'] = nodeDegrees.get(node.data.id);
  });
  console.timeEnd("Sort/Filter Nodes");
  
  console.time('cy');
  const cy = cytoscape( { headless:true, container:undefined, elements:{nodes:filteredNodes} } );
  console.timeEnd('cy');

  console.time('Filter Edges');
  const filteredEdges = [];
  edges.forEach( edge => {
    const source = edge.data.source;
    const target = edge.data.target;
    let sourceFound = false;
    let targetFound = false;
    filteredNodes.forEach( node => {
      if(node.data.id === source)
        sourceFound = true;
      if(node.data.id === target)
        targetFound = true;
    });
    if(sourceFound && targetFound)
      filteredEdges.push(edge);
  });
  console.timeEnd('Filter Edges');

  console.log(filteredEdges.length);

  console.time('Add Edges');
  filteredEdges.forEach( edge => {
    try{
      cy.add({
        group: 'edges',
        data: edge.data,
        classes: edge.classes,
      });  
    }catch(err){ return; }
  });
  console.timeEnd('Add Edges');

  

  return cy.json().elements;
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

function addInteraction(nodes, edge, sources, network, nodeDegreeMap, nodeMetadata, interactionIDs){
  const interaction= edgeType(edge);
  const networkEdgeData = {data: {
    id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
    label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
    source: nodes[0],
    target: nodes[1],
    class: interaction,
    parsedMetadata:sources
  },classes:interaction};

  nodes.forEach((node)=>{
    if(!nodeDegreeMap.has(node)){
      const metadata=nodeMetadata.get(node);
      const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');
      nodeDegreeMap.set(node,1);
      network.nodes.push({data:{
        class: "ball",
        id: node,
        label: node,
        queried: interactionIDs.indexOf(node) != -1,
        parsedMetadata:[
          ['Type',
          'bp:'+metadata[0].split(' ')[0].replace(/Reference/g,'').replace(/;/g,',')],
          ['Database IDs', links]
        ]
      }});
    }
    else {
      let degree = nodeDegreeMap.get(node);
      nodeDegreeMap.set(node, degree+1);
    }
  });

  network.edges.push(networkEdgeData);

}

module.exports = {getInteractionGraphFromPC};