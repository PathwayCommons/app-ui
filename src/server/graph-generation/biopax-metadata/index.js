const metadataParser = require('./metadataParserJson');

/**
 * 
 * @param {*} biopaxElement Metadata for a node in the network
 * @param {*} biopaxFile BioPAX metadata `Map`
 * @param {*} visited Array containing all previously visited network nodes
 * @param {*} nodeType Is the node a cross-reference or not?
 * @returns A tree array containing metadata for the node
 */
function buildBioPaxSubtree(biopaxElement, biopaxFile, visited, nodeType = 'default') {
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

    //Get Cellular Location
    let cellLocation = biopaxElement['cellularLocation'];
    if (cellLocation && cellLocation.indexOf('http') !== -1) {
      cellLocation = getElementFromBioPax(biopaxFile, cellLocation);
      cellLocation = cellLocation['term'];
    }
    if (cellLocation) { result.push(['Cellular Location', cellLocation]); }
  }

  //Get database id
  let db = biopaxElement['db'];
  let id = biopaxElement['id'];
  if (db && id) { result.push(['Database ID', [db, id]]); }

  //Get any cross references
  let xref = biopaxElement['xref'];

  //Resolve String/Array Issue
  if (typeof xref == 'string') { xref = [xref]; }
  if (!(xref)) { xref = []; }

  //Get entity reference and add it to xref
  let eref = biopaxElement['entityReference'];
  if (eref) xref.push(eref);


  //Recurse on each cross reference (Lim it level depth to 2)
  if (xref) {

    for (let i = 0; i < xref.length; i++) {

      let keyName = 'Reference';
      if (i == (xref.length - 1) && eref) { keyName = 'EntityReference' };

      //Get Referenced Element
      let refElement = getElementFromBioPax(biopaxFile, xref[i]);

      //Make a copy of visited
      let visitCopy = visited.slice();

      //Check validity of element
      if (!(refElement)) { continue; }

      //Recurse on current element
      if (visitCopy.indexOf(xref[i]) <= -1 && visitCopy.length <= 2) {

        visitCopy.push(xref[i]);
        result.push([keyName, buildBioPaxSubtree(refElement, biopaxFile, visitCopy, keyName)]);

      }
    }
  }
  //Return subtree
  return result;
}

/**
 * 
 * @param {*} children Metadata for an entity in the network
 * @param {*} biopaxFile BioPAX metadata `Map`
 * @returns Tree array containing all metadata about the given entity
 */
function buildBioPaxTree(children, biopaxFile) {
  //Wrapper function for buildBioPaxSubtree recursion
  
  let result = [];

  //make sure the metadata exists
  if (!(children))
    return;

  //Get the node id, as defined in getProcessedBioPax
  let id = children['pathid'];
  if (!(id)) { id = children['about']; }
  if (!(id)) { return; }

  //Build a subtree
  let visited = [id];
  let subtree = buildBioPaxSubtree(children, biopaxFile, visited);
  result.push([id, subtree]);

  //Return Biopax Tree
  return result;
}

/**
 * 
 * @param {*} word A String containing at least n underscores
 * @param {*} n The number of underscores to be removed
 * @returns The same string, but with all characters after nth underscore removed
 */
function removeAfterUnderscore(word, n) {
  let splitWord = word.split('_');
  let newWord = '';
  for (let i = 0; i < n; i++) {
    if (i != (n - 1)) {
      newWord += splitWord[i] + '_';
    } else {
      newWord += splitWord[i];
    }
  }
  return newWord;
}

/**
 * 
 * @param {*} biopaxFile BioPAX metadata `Map`
 * @param {*} id String representing potential BioPAX ID
 * @returns BioPAX metadata for that ID (if it exists) or null (if it doesn't)
 */
function getElementFromBioPax(biopaxFile, id) {

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
 * @param {*} biopax BioPAX metadata `Map`
 * @returns Subtree containing BioPax metadata for the node
 */
function getBioPaxSubtree(nodeId, biopax) {

  // The original entity IDs have been converted in the cytoscape network.
  // Need to first find the original BioPAX entity ID, then collect metadata.

  //Search for ID exactly as it appears
  let searchTerm = getElementFromBioPax(biopax, nodeId);
  if (searchTerm)
    return buildBioPaxTree(searchTerm, biopax);
  
  //Search for ID after last underscore
  searchTerm = getElementFromBioPax(biopax, nodeId.substring(nodeId.lastIndexOf("_") +1));
  if (searchTerm)
    return buildBioPaxTree(searchTerm, biopax);
  

  //Remove extra identifiers appended by Cytoscape
  let fixedNodeId = removeAfterUnderscore(nodeId, 2);

  //Resolve issues if there is no appended identifiers
  if (nodeId.indexOf('_') <= -1) 
    fixedNodeId = nodeId;

  //Search for ID in the first 2 underscores
  searchTerm = getElementFromBioPax(biopax, fixedNodeId);
  if (searchTerm)
    return buildBioPaxTree(searchTerm, biopax);

  //Search for ID in between first and second underscore
  searchTerm = getElementFromBioPax(biopax, fixedNodeId.substring(fixedNodeId.lastIndexOf("_") +1));
  if (searchTerm)
    return buildBioPaxTree(searchTerm, biopax);

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
  //turn the biopax string into json
  const biopaxElementMap = getProcessedBioPax(biopaxJsonText);
  const nodeMetadataMap = {};

  //try to map each id in the biopax data to an id in the cytoscape json
  //add the data from biopax to the json
  nodes.forEach(node => {
    const id = node.data.id;
    nodeMetadataMap[id] = metadataParser(getBioPaxSubtree(id, biopaxElementMap));
  });

  return nodeMetadataMap;
}

module.exports = { getProcessedBioPax, getBioPaxMetadata};