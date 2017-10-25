/**
    Pathway Commons Central Data Cache

    Metadata Mapper for JSON-LD
    metadataMapperJson.js

    Purpose : Maps Metadata to SBGN nodes and returns an enhanced cytoscape json

    Requires : Valid Matching BioPax and SBGN Files

    Effects : Utilizes Node DOM Parser to parse XML files

    Note : Script may take time to process large BioPax files

    @author Harsh Mistry
    @version 1.1 2017/10/17
**/

const fs = require('fs');
const convert = require('sbgnml-to-cytoscape');
const metadataParser = require('./metadataParserJson.js');
var ProgressBar = require('ascii-progress');
var DOMParser = require('xmldom').DOMParser;

//Map metadata from BioPax to nodes
//Returns a cy cytoscape json
//Requires valid BioPax and sbgn files
module.exports = function (biopax, sbgn) {
  //Convert sbgn to json
  let cyGraph = convert(sbgn);

  //Get mapped node list
  var nodes = cyGraph.nodes;
  cyGraph.nodes = processBioPax(biopax, nodes);

  //Return Enhanced JSON
  return cyGraph;
}

//Build a sub tree array for a biopax element
function buildBioPaxSubtree(biopaxElement, biopaxFile, visited, nodeType = 'default') {
  var result = [];

  if (nodeType !== 'Reference') {
    //Get type
    var type = biopaxElement['@type']
    if (type) { result.push(['Type', type]); }

    //Get data source
    var dataSource = biopaxElement['dataSource'];
    if (dataSource) { result.push(['Data Source', dataSource]); }

    //Get display name
    var dName = biopaxElement['displayName'];
    if (dName) { result.push(['Display Name', dName]); }

    //Get Comments
    var comment = biopaxElement['comment'];
    if (comment) { result.push(['Comment', comment]); }

    //Get Names
    var name = biopaxElement['name'];
    if (name) { result.push(['Names', name]); }

    //Get Standard Name
    var sName = biopaxElement['standardName'];
    if (sName) { result.push(['Standard Name', sName]); }

    //Get Chemical Formula
    var formula = biopaxElement['chemicalFormula'];
    if (formula) { result.push(['Chemical Formula', formula]); }

    //Get Cellular Location
    var cellLocation = biopaxElement['cellularLocation'];
    if (cellLocation && cellLocation.indexOf('http') !== -1) {
      cellLocation = getElementFromBioPax(biopaxFile, cellLocation);
      cellLocation = cellLocation[0]['term'];
    }
    if (cellLocation) { result.push(['Cellular Location', cellLocation]); }
  }

  //Get database id
  var db = biopaxElement['db'];
  var id = biopaxElement['id'];
  if (db && id) { result.push(['Database ID', [db, id]]); }

  //Get any cross references
  var xref = biopaxElement['xref'];

  //Resolve String/Array Issue
  if (typeof xref == 'string') { xref = [xref]; }
  if (!(xref)) { xref = []; }

  //Get entity reference and add it to xref
  var eref = biopaxElement['entityReference']
  if (eref) xref.push(eref);


  //Recurse on each cross reference (Lim it level depth to 4)
  if (xref) {

    for (var i = 0; i < xref.length; i++) {

      var keyName = 'Reference';
      if (i == (xref.length - 1) && eref) { keyName = 'EntityReference' };

      //Get Referenced Element
      var refElement = getElementFromBioPax(biopaxFile, xref[i]);

      //Make a copy of visited
      var visitCopy = visited.slice();

      //Check validity of element
      if (!(refElement)) { continue; }

      //Recurse on current element
      if (visitCopy.indexOf(xref[i]) <= -1 && visitCopy.length <= 2) {

        visitCopy.push(xref[i]);
        result.push([keyName, buildBioPaxSubtree(refElement[0], biopaxFile, visitCopy, keyName)]);

      }
    }
  }
  //Return subtree
  return result;
}

//Build a tree array for a biopax file
function buildBioPaxTree(children, biopaxFile) {
  var result = [];

  if (!(children[0])) { return };

  children = children[0];

  //Get the node id
  var id = children['pathid']
  if (!(id)) { id = children['about']; }
  if (!(id)) { return; }

  //Build a subtree
  var visited = [id];
  var subtree = buildBioPaxSubtree(children, biopaxFile, visited);
  result.push([id, subtree]);

  //Return Biopax Tree
  return result;
}

//Remove all characters after nth instance of underscore
//Requires the string to contain at least 1 underscore
function removeAfterUnderscore(word, numberOfElements) {
  var splitWord = word.split('_');
  var newWord = '';
  for (var i = 0; i < numberOfElements; i++) {
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
  if (id.indexOf('http') <= -1) {
    id = 'http://pathwaycommons.org/pc2/' + id;
  }

  //Get element matching the id
  var result = biopaxFile.filter(data => data['pathid'] === id);
  if (result[0]) { return result; }
  else { return null; }
}

//Get subtree for each node
//Requires tree to be a valid biopax tree
function getBioPaxSubtree(nodeId, biopax) {
  //Remove extra identifiers appended by cytoscape.js
  var fixedNodeId = removeAfterUnderscore(nodeId, 2);

  //Resolve issues if there is no appended identifiers
  if (nodeId.indexOf('_') <= -1) {
    fixedNodeId = nodeId;
  }

  //Conduct a basic search
  var basicSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (basicSearch) { return buildBioPaxTree(basicSearch, biopax); }

  //Check if id is an unification reference
  fixedNodeId = 'UnificationXref_' + nodeId;

  //Conduct a unification ref search
  var uniSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (uniSearch) { return buildBioPaxTree(uniSearch, biopax); }

  //Check if id is an external identifier
  var fixedNodeId = removeAfterUnderscore(nodeId, 2);
  fixedNodeId = 'http://identifiers.org/' + fixedNodeId.replace(/_/g, '/');

  //Conduct a external identifier search
  var extSearch = getElementFromBioPax(biopax, fixedNodeId);
  if (extSearch) { return buildBioPaxTree(extSearch, biopax); }

  return null;
}

//Replace all instances of a substring with a given string
//Returns a string
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

//Process biopax file
function processBioPax(data, nodes) {

  data = replaceAll(data, "@id", 'pathid');
  //fs.writeFileSync('test', data);

  var data = JSON.parse(data);

  //Get Graph Elements
  var graph = data['@graph'];

  //Loop through all nodes
  for (var i = 0; i < nodes.length; i++) {

    //Get element values
    var id = nodes[i].data.id;

    //Get metadata for current node
    var metadata = getBioPaxSubtree(id, graph);

    //Parse metadata
    try {
      //Add data to nodes
      var parsedMetadata = metadataParser(metadata);
      nodes[i].data.parsedMetadata = parsedMetadata;
    }
    catch (e) { console.log(e); throw e; }

  }

  //Return nodes
  return nodes;
}

