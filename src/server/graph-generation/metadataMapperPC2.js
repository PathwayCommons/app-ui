const convert = require('sbgnml-to-cytoscape');
const pcServices = require('./pcServices');
var jp = require('jsonpath');
const Promise = require('bluebird');

//Map metadata from BioPax to nodes
//Returns a cy cytoscape json
//Requires valid BioPax and sbgn files
module.exports = function (biopax, sbgn) {
  //Convert sbgn to json
  let cyGraph = convert(sbgn);

  //Get mapped node list
  var nodes = cyGraph.nodes;
  return processBioPax(biopax, nodes).then(data => {cyGraph.nodes = data; return cyGraph});
}

//Get data from pc2 via traverse
//Returns either null or a data object
function getData(id, path) {

  //Append pc2 address, if id is not already an uri
  if (id.indexOf('http') <= -1) {
    id = 'http://pathwaycommons.org/pc2/' + id;
  }

  return pcServices.traversePC2(id, path).then(data => data.traverseEntry[0].value);

}

//Validate value and push the result to an array
//Effects : modifies the given array
function pushData(value, key, result) {
  if (value.length !== 0) {
    result.push([key, value]);
  }
  return result;
}

//Build a sub tree array for a biopax element
function buildBioPaxTree(id) {
  var result = [];

  //Get type
  //var type = biopaxElement['@type']
  //if (type) result.push(['Type', type]);

  //Create a array of all promises to resolve
  var promiseArray = [
    getData(id, 'Entity/dataSource'),
    getData(id, 'SimplePhysicalEntity/entityReference/displayName'),
    getData(id, 'Entity/comment'),
    getData(id, 'Named/name'),
    getData(id, 'Named/standardName'),
    getData(id, 'Entity/cellularLocation/term'),
    getData(id, 'SimplePhysicalEntity/entityReference/xref/db'),
    getData(id, 'SimplePhysicalEntity/entityReference/xref/id'),
    getData(id, 'Entity/xref/db'),
    getData(id, 'Entity/xref/id')
  ];

  //Wait for all promises to resolve
  return Promise.all(promiseArray).then(data => {
    //Push basic results to result
    result = pushData(data[0], 'Data Source', result);
    result = pushData(data[1], 'Display Name', result);
    result = pushData(data[2], 'Comment', result);
    result = pushData(data[3], 'Names', result);
    result = pushData(data[4], 'Standard Name', result);
    result = pushData(data[5], 'Cellular Location', result);

    //Merge Database ID's
    var erefDatabases = data[6];
    var erefDatabaseIds = data[7];
    var xrefDatabases = data[8];
    var xrefDatabaseIds = data[9];
    if (erefDatabases.length !== 0 || xrefDatabases !== 0) {
      result.push(['Databases', erefDatabases.concat(xrefDatabases)]);
      result.push(['Database IDs', erefDatabaseIds.concat(xrefDatabaseIds)]);
    }

    //Return subtree
    return result;
  })

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
function getElementFromBioPax(id, biopaxFile) {
  //Append pc2 address, if id is not already an uri
  if (id.indexOf('http') <= -1) {
    id = 'http://pathwaycommons.org/pc2/' + id;
  }


  var str = "$..[?(@.pathid==\"" + id + "\")]";
  //Get element matching the id
  var result = jp.query(biopaxFile, str);
  if (result[0]) return result;
  else return null;
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
  var basicSearch = getElementFromBioPax(fixedNodeId, biopax);
  if (basicSearch) return buildBioPaxTree(fixedNodeId);

  //Check if id is an unification reference
  fixedNodeId = 'UnificationXref_' + nodeId;

  //Conduct a unification ref search
  var uniSearch = getElementFromBioPax(fixedNodeId, biopax);
  if (uniSearch) return buildBioPaxTree(fixedNodeId);

  //Check if id is an external identifier
  var fixedNodeId = removeAfterUnderscore(nodeId, 2);
  fixedNodeId = 'http://identifiers.org/' + fixedNodeId.replace(/_/g, '/');

  //Conduct a external identifier search
  var extSearch = getElementFromBioPax(fixedNodeId, biopax);
  if (extSearch) return buildBioPaxTree(fixedNodeId);

  return Promise.resolve(1);
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

  var result = [];
  var promises = [];

  return Promise.map(nodes, function (el) {
    //Get element values
    var id = el.data.id;

    promises.push(getBioPaxSubtree(id, graph).then(value => {
      el.data.parsedMetadata = value;
      result.push(el);
    }));
  }, { concurrency: 8 }).then(function (data) {
    return Promise.map(promises, function(el) {}, { concurrency: 8 }).then(
      value => result
    )
  });
}



