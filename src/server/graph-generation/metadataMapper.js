/**
    Pathway Commons Central Data Cache

    Metadata Mapper
    metadataMapper.js

    Purpose : Maps Metadata to SBGN nodes and returns an enhanced cytoscape json

    Requires : Valid Matching BioPax and SBGN Files

    Effects : Utilizes Node DOM Parser to parse XML files

    Note : Script may take time to process large BioPax files

    To do : Integrate Web API Traverse Function

    @author Harsh Mistry
    @version 1.1 2017/10/10
**/

const fs = require('fs');
const convert = require('sbgnml-to-cytoscape');
const metadataParser = require('./metadataParser.js');
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


//Filters the given array to those which when passed into matcher return true
Array.prototype.where = function (matcher) {
  var result = [];
  for (var i = 0; i < this.length; i++) {
    if (matcher(this[i])) {
      result.push(this[i]);
    }
  }
  return result;
};


//Return elements within matching attribute values
function GetElementsByAttribute(tag, attr, attrValue, doc) {
  //Get elements and convert to array
  var elems = Array.prototype.slice.call(doc.getElementsByTagName(tag), 0);

  //Matches an element by its attribute and attribute value
  var matcher = function (el) {
    return el.getAttribute(attr) == attrValue;
  };

  return elems.where(matcher);
}

//Return elements with matching tag fields
function GetElementsByAttributeWithoutTag(attr, attrValue, doc) {
  //Get all level-1 items in the biopax file
  var elems = Array.prototype.slice.call(doc.getElementsByTagName('rdf:RDF')[0].childNodes, 0);

  //Matches an element by its attribute and attribute value
  var matcher = function (el) {
    if (!el.tagName) return false;
    return el.getAttribute(attr) == attrValue;
  };

  //Filter all items and return results
  return elems.filter(matcher);
}

//Build a sub tree array for a biopax element
function buildBioPaxSubtree(biopaxElement, biopaxFile, visited) {
  var result = [];

  if (!biopaxElement) return result;

  var children = biopaxElement.childNodes;

  //Iterate over all children
  for (var i = 0; i < children.length; i++) {
    var content;

    //Make a copy of visited
    var visitCopy = visited;

    //Skip if current child is not a element
    if (!(children[i].tagName)) continue;

    //Check if current node is a resource
    var resource = children[i].getAttribute('rdf:resource');
    var tag = children[i].tagName;
    var entityRef = (tag === 'bp:entityReference');

    //Recurse on the referenced element
    if ((resource && resource.charAt(0) === '#') || entityRef) {
      //Get reference id
      var refId = resource.charAt(0) === '#' ?  resource.substring(1) : resource;
      var referencedItem = GetElementsByAttributeWithoutTag('rdf:ID', refId, biopaxFile)[0];

      //Check if next node was visited
      var nodeVisited = (visitCopy.indexOf(refId) <= -1);

      //Restore original id for  entity references
      if (entityRef && resource.charAt(0) !== '#') {
        //Store ID if current element is a entity reference
        //refId = children[i].getAttribute('rdf:resource');
        tag += '_' + refId;
        referencedItem = GetElementsByAttributeWithoutTag('rdf:about', refId, biopaxFile)[0];
      }

      //Get subtree for the referenced item
      if (((referencedItem && nodeVisited) || entityRef) && visitCopy.length <= 10) {
        visitCopy.push(refId);
        content = buildBioPaxSubtree(referencedItem, biopaxFile, visitCopy);
      }
      else {
        if (children[i].childNodes.length > 0) content = children[i].childNodes[0].data;
      }
    }
    //Set content to existing element
    else {
      if (children[i].childNodes.length > 0) content = children[i].childNodes[0].data;
    }

    //Push Data
    result.push([tag, content]);
  }


  //Return subtree
  return result;
}

//Build a tree array for a biopax file
function buildBioPaxTree(children, biopaxFile) {
  var result = [];

  //Iterate over all children
  for (var i = 0; i < children.length; i++) {

    //Skip if there current child is not an element
    if (!(children[i].tagName)) continue;

    //Get the node id
    var id = children[i].getAttribute('rdf:ID');
    if (!(id)) id = children[i].getAttribute('rdf:about');
    if (!(id)) continue;

    //Build a subtree
    var visited = [id];
    var subtree = buildBioPaxSubtree(children[i], biopaxFile, visited);
    result.push([id, subtree]);

  }
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

//Get subtree for each node
//Requires tree to be a valid biopax tree
function getBioPaxSubtree(nodeId, tree) {
  //Remove extra identifiers appended by cytoscape.js
  var fixedNodeId = removeAfterUnderscore(nodeId, 2);

  //Resolve issues if there is no appended identifiers
  if (nodeId.indexOf('_') <= -1) {
    fixedNodeId = nodeId;
  }

  //Loop over all level-1 subnodes and return the corresponding metadata object
  for (var i = 0; i < tree.length; i++) {
    if (tree[i][0].indexOf(fixedNodeId) > -1) {
      return tree[i][1];
    }
  }

  //Check if id is an unification reference
  fixedNodeId = 'UnificationXref_' + nodeId;

  //Loop over all level-1 subnodes and return the corresponding metadata object
  for (var i = 0; i < tree.length; i++) {
    if (tree[i][0].indexOf(fixedNodeId) > -1) {
      return tree[i][1];
    }
  }

  //Check if id is an external identifier
  fixedNodeId = 'http://identifiers.org/' + nodeId.replace(/_/g, '/');

  //Loop over all level-1 subnodes and return the corresponding metadata object
  for (var i = 0; i < tree.length; i++) {
    if (tree[i][0].indexOf(fixedNodeId) > -1) {
      return tree[i][1];
    }
  }

  return null;
}

//Process biopax file
function processBioPax(data, nodes) {
  //Parse XML Data
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(data, 'text/xml');

  //Get BioPax tree representation
  var items = xmlDoc.getElementsByTagName('rdf:RDF')[0].childNodes;
  var bioPaxTree = buildBioPaxTree(items, xmlDoc);

  //Loop through all nodes
  for (var i = 0; i < nodes.length; i++) {

    //Get element values
    var id = nodes[i].data.id;

    //Get metadata for current node
    var metadata = getBioPaxSubtree(id, bioPaxTree);

    //Parse metadata
    try {
    var parsedMetadata = metadataParser(metadata);
    }
    catch (e) {console.log(e);}

    //Add data to nodes
    nodes[i].data.metadata = metadata;
    nodes[i].data.parsedMetadata = parsedMetadata;

  }

  //Return nodes
  return nodes;
}



