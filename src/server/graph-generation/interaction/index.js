const _ = require('lodash');
const pc = require('../../pathway-commons');
const logger = require('./../../logger');

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

function getInteractionInfoFromPC(sources) {
  const idArray = _.uniq(_.concat([], sources)); //convert sources to array

  const geneIds = idArray.map(source =>
    source.includes('pathwaycommons') ? getGeneIdFromPC(source) : source.replace(/\//g,' ')
  );
   const metaData = {
     networkMetadata: {
       name : geneIds.join(','),
       datasource : 'Pathway Commons'
     },
     ids : geneIds
   };

   return getInteractionGraphFromPC(geneIds).then(network => {
     return {
       network : network,
       metaData : metaData
     };
   }).catch((e)=>{
     logger.error(e);
     return 'ERROR : could not retrieve graph from PC';
   });
}

function getGeneIdFromPC(source) {
  const queryObj = {
    cmd : 'traverse',
    uri : source,
    path:`${_.last(source.split('/')).split('_')[0]}/displayName`
  };

  return pc.query(queryObj)
  .then(result=>result.json())
  .then(id=> _.words(id.traverseEntry[0].value[0]).length===1 ? id.traverseEntry[0].value[0].split('_')[0] : '');
}

function getInteractionGraphFromPC(interactionIDs){
  const params = {
    cmd : 'graph',
    source : interactionIDs,
    pattern : ['controls-phosphorylation-of','in-complex-with','controls-expression-of', 'interacts-with'],
    kind : interactionIDs.length > 1 ? 'pathsbetween' : 'neighborhood',
    format : 'txt'
  };

  //Fetch graph from PC
  return pc.query(params)
  .then(res => parse(res, interactionIDs));
}

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
  let nodeMap=new Map(); //keeps track of nodes that have already been added
  if(data){
    const dataSplit=data.split('\n\n');
    const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
    dataSplit[0].split('\n').slice(1).forEach(line => {
      const splitLine=line.split('\t');
      const edgeMetadata = interactionMetadata(splitLine[6],splitLine[4]);
      addInteraction([splitLine[0], splitLine[2]], splitLine[1], edgeMetadata, network, nodeMap, nodeMetadata, queryIds);
    });
    return network;
  }
  return {};
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

function addInteraction(nodes, edge, sources, network, nodeMap, nodeMetadata, interactionIDs){
  const interaction= edgeType(edge);
  nodes.forEach((node)=>{
    if(!nodeMap.has(node)){
      const metadata=nodeMetadata.get(node);
      nodeMap.set(node,true);
      const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');

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
  });

  network.edges.push({data: {
    id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
    label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
    source: nodes[0],
    target: nodes[1],
    class: interaction,
    parsedMetadata:sources
  },classes:interaction});
}

module.exports = {getInteractionInfoFromPC};