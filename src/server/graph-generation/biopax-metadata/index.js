const metadataParser = require('./metadataParserJson');
var biopaxFile = null;
/**
 * 
 * @param {*} biopaxElement Metadata for an entity from BioPAX
 * @param {*} nodeType Is this a xref or entity?
 */
function collectEntityMetadata(biopaxElement, nodeType = 'default'){
  
  let result = [];
  //Collect relevant data on this node, and push it into output
  if (nodeType !== 'Reference') {
    //Get type
    let type = biopaxElement['@type'];
    if (type) { result.push(['Type', type]); }

    //Get data source
    let dataSource = biopaxElement['dataSource'];
    if (dataSource) { result.push(['Data Source', dataSource]); }

    //Get display name
    let dName = biopaxElement['displayName'];
    if (dName) { result.push(['Display Name', dName]); }

    //Get Comments
    let comment = biopaxElement['comment'];
    if (comment) { result.push(['Comment', comment]); }

    //Get Names
    let name = biopaxElement['name'];
    if (name) { result.push(['Names', name]); }

    //Get Standard Name
    let sName = biopaxElement['standardName'];
    if (sName) { result.push(['Standard Name', sName]); }

    //Get Chemical Formula
    let formula = biopaxElement['chemicalFormula'];
    if (formula) { result.push(['Chemical Formula', formula]); }
  }

  //Get database id
  let db = biopaxElement['db'];
  let id = biopaxElement['id'];
  if (db && id) { result.push(['Database ID', [db, id]]); }

  return result;
}

/**
 * 
 * @param {*} entity Metadata for an entity in the network
 * @returns Tree array containing all metadata about the given entity
 */
function buildBioPaxTree(entity) {  
  let result = [];

  //make sure the metadata exists
  if (!(entity))
    return;

  //Get the node id, as defined in getProcessedBioPax
  let id = entity['pathid'];
  if (!(id)) { id = entity['about']; }
  if (!(id)) { return; }

  //get BioPAX metadata for this node
  let collectedData = collectEntityMetadata(entity);

  //Collect Data for cross-references
  let xref = entity['xref'];
  if (typeof xref == 'string')
    xref = [xref];
  if (!(xref))
    xref = [];
  let eref = entity['entityReference'];
  if (eref)
    xref.push(eref);

  processXrefs(xref,eref,collectedData);
  
  result.push([id,collectedData]);
  return result;
}

function processXrefs(xref,eref,collectedData){

  let ErefXref = [];

  for (let i = 0; i < xref.length; i++) {
    //Check if this is a cross-reference or entity reference
    let keyName = 'Reference';
    if (i == (xref.length - 1) && eref)
      keyName = 'EntityReference';

    //Get Referenced element and make sure it's valid
    let refElement = getElementFromBioPax(xref[i]); 
    if (!(refElement))
      continue;

    //create list of xrefs for eref
    if(keyName === "EntityReference"){
      ErefXref = refElement['xref'];
      if (typeof ErefXref == 'string')
      ErefXref = [ErefXref];
      if (!(ErefXref))
      ErefXref = [];
    }

    //Collect data and add to tree array
    collectedData.push([keyName,collectEntityMetadata(refElement,keyName)]);
  }


  //Also collect data for entity reference's cross-references
  //almost identically to above
  for(let i=0;i<ErefXref.length;i++){
    let keyName = 'Reference';
    let refElement = getElementFromBioPax(ErefXref[i]); 

    if (!(refElement))
      continue;

    collectedData.push([keyName,collectEntityMetadata(refElement,keyName)]);
  }

}

/**
 * 
 * @param {*} id String representing potential BioPAX ID
 * @returns BioPAX metadata for that ID (if it exists) or null (if it doesn't)
 */
function getElementFromBioPax(id) {

  //Remove any URL stuff from the ID, just like getProcessedBioPax
  if (id.indexOf('http') !== -1 || id.indexOf('/') !== -1) {
    var lastIndex = id.lastIndexOf('/');
    id = id.substring(lastIndex + 1);
  }

  //Get element matching the ID
  //make sure the ID isn't "" or null
  if(id)
    return biopaxFile.get(id);
  else return null;
}

/**
 * 
 * @param {*} nodeId node ID from Cytoscape network JSON
 * @returns Subtree containing BioPax metadata for the node
 */
function matchCyIdToBiopax(nodeId) {

  // The original entity IDs have been converted in the cytoscape network.
  // Need to first find the original BioPAX entity ID, then collect metadata.

  //Alot of this stuff is strange but it is ALL NECESSARY to correctly map the IDs

  //Search for ID exactly as it appears
  let searchTerm = getElementFromBioPax(nodeId);
  if (searchTerm)
    return searchTerm;
  
  //Search for ID after last underscore
  searchTerm = getElementFromBioPax(nodeId.substring(nodeId.lastIndexOf("_") +1));
  if (searchTerm)
    return searchTerm;
  

  //Find index of second underscore
  let i=0,index=null;
  while(i<2 && index !==-1){
    index = nodeId.indexOf("_", index +1);
    i++;
  }

  //Remove extra identifiers appended by Cytoscape
  //i.e. everything after the second underscore
  let fixedNodeId = nodeId.substring(0,index);

  //The last two methods won't work if there are no underscores in the ID
  if (nodeId.indexOf('_') <= -1) 
    return null;

  //Search for ID in the first 2 underscores
  searchTerm = getElementFromBioPax(fixedNodeId);
  if (searchTerm)
    return searchTerm;

  //Search for ID in between first and second underscore
  searchTerm = getElementFromBioPax(fixedNodeId.substring(fixedNodeId.lastIndexOf("_") +1));
  if (searchTerm)
    return searchTerm;

  //Search Failed, return null
  return null;
}

/**
 * 
 * @param {*} biopaxJsonText String containing BioPAX network metadata
 * @returns `Map` containing BioPAX network metadata
 */
function getProcessedBioPax(biopaxJsonText) {
  //parse String into JSON object, rename '@id' property to 'pathid'
  const graph = JSON.parse(biopaxJsonText.replace(new RegExp('@id', 'g'), 'pathid'))['@graph'];
  const biopaxElementMap = new Map();

  //The 'pathid' property has a format like: http://pathwaycommons.org/pc2/someID
  //Convert it to this format: someID, and make it the key for the map
  for (const element of graph) {
    const fullId = element['pathid'];
    const lastIndex = fullId.lastIndexOf('/');
    const subId = fullId.substring(lastIndex + 1);

    biopaxElementMap.set(subId, element);
  }

  return biopaxElementMap;
}

/**
 * 
 * @param {*} biopaxJsonText String containing BioPAX metadata for the network
 * @param {*} nodes JSON object containing all the nodes in the network
 * @returns Processed metadata for each node in the network
 */
function getBioPaxMetadata(biopaxJsonText, nodes) {

  //BioPAX metadata comes as a string, turn it into a Map
  biopaxFile = getProcessedBioPax(biopaxJsonText);

  const nodeMetadataMap = {};

  //Iterate through nodes in Cy network, adding metadata to each
  nodes.forEach(node => {
    const CyId = node.data.id;
    //metadata for the Cytoscape node
    const BiopaxData = matchCyIdToBiopax(CyId);
    //build the tree for metadata and add it to the map
    nodeMetadataMap[CyId] = metadataParser(buildBioPaxTree(BiopaxData));
  });

  return nodeMetadataMap;
}

module.exports = { getProcessedBioPax, getBioPaxMetadata};