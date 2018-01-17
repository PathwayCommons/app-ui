const metadataParser = require('./metadataParserJson');

//Build a sub tree array for a biopax element
function buildBioPaxSubtree(biopaxElement, biopaxFile, visited, nodeType = 'default') {
  let result = [];

  if (nodeType !== 'Reference') {
    //Get type
    let type = biopaxElement['@type']
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
  let eref = biopaxElement['entityReference']
  if (eref) xref.push(eref);


  //Recurse on each cross reference (Lim it level depth to 4)
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

//Build a tree array for a biopax file
function buildBioPaxTree(children, biopaxFile) {
  let result = [];

  if (!(children)) { return };

  //Get the node id
  let id = children['pathid']
  if (!(id)) { id = children['about']; }
  if (!(id)) { return; }

  //Build a subtree
  let visited = [id];
  let subtree = buildBioPaxSubtree(children, biopaxFile, visited);
  result.push([id, subtree]);

  //Return Biopax Tree
  return result;
}

//Remove all characters after nth instance of underscore
//Requires the string to contain at least 1 underscore
function removeAfterUnderscore(word, numberOfElements) {
  let splitWord = word.split('_');
  let newWord = '';
  for (let i = 0; i < numberOfElements; i++) {
    if (i != (numberOfElements - 1)) {
      newWord += splitWord[i] + '_';
    } else {
      newWord += splitWord[i];
    }
  }
  return newWord;
}

//Check if ID even exists in the biopax file
//Returns teh matching element or null
function getElementFromBioPax(biopaxFile, id) {

  //Append pc2 address, if id is not already an uri
  if (id.indexOf('http') !== -1 || id.indexOf('/') !== -1) {
    var lastIndex = id.lastIndexOf('/');
    id = id.substring(lastIndex + 1);
  }

  //Get element matching the id
  let result = biopaxFile.get(id);
  return result;
}

//Get subtree for each node
//Requires tree to be a valid biopax tree
function getBioPaxSubtree(nodeId, biopax) {
  //Remove extra identifiers appended by cytoscape.js
  let fixedNodeId = removeAfterUnderscore(nodeId, 2);

  //Resolve issues if there is no appended identifiers
  if (nodeId.indexOf('_') <= -1) {
    fixedNodeId = nodeId;
  }

  //Conduct a basic search
  let basicSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (basicSearch) { return buildBioPaxTree(basicSearch, biopax); }

  //Check if id is an unification reference
  fixedNodeId = 'UnificationXref_' + nodeId;

  //Conduct a unification ref search
  let uniSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (uniSearch) { return buildBioPaxTree(uniSearch, biopax); }

  //Check if id is an external identifier
  fixedNodeId = removeAfterUnderscore(nodeId, 2);
  fixedNodeId = 'http://identifiers.org/' + fixedNodeId.replace(/_/g, '/');

  //Conduct a external identifier search
  let extSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (extSearch) { return buildBioPaxTree(extSearch, biopax); }

  //Conduct a plain search with slashes
  fixedNodeId = nodeId.replace(/_/g, '/');
  let slashSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (slashSearch) { return buildBioPaxTree(slashSearch, biopax); }

  //Conduct a plain search as a last resort (Only for Non Pathway URI's)
  let regularSearch = getElementFromBioPax(biopax, nodeId);
  if (regularSearch) { return buildBioPaxTree(regularSearch, biopax); }

  return null;
}

function getProcessedBioPax(biopaxJsonText) {
  const graph = JSON.parse(biopaxJsonText.replace(new RegExp('@id', 'g'), 'pathid'))['@graph'];
  const biopaxElementMap = new Map();

  for (const element of graph) {
    const fullId = element['pathid'];
    const lastIndex = fullId.lastIndexOf('/');
    const subId = fullId.substring(lastIndex + 1);

    biopaxElementMap.set(subId, element);
  }

  return biopaxElementMap;
}


function getBioPaxMetadata(biopaxJsonText, nodes) {
  const biopaxElementMap = getProcessedBioPax(biopaxJsonText);

  const nodeMetadataMap = {};

  nodes.forEach(node => {
    const id = node.data.id;
    nodeMetadataMap[id] = metadataParser(getBioPaxSubtree(id, biopaxElementMap));
  });

  return nodeMetadataMap;
}

module.exports = { getProcessedBioPax, getBioPaxMetadata};