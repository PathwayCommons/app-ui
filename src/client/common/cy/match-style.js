const _ = require('lodash');

const {applyStyle, removeStyle} = require('./manage-style');


//Get all the names associated with a node
//Requires a valid cytoscape node
//Returns a list of strings
const getNames = (node) => {
  const parsedMetadata = node.data('parsedMetadata');
  let label = [node.data('label')];


  if (!parsedMetadata) return label;

  //Get Various Names
  const standardName = parsedMetadata.filter(pair => pair[0] === 'Standard Name');
  const names = parsedMetadata.filter(pair => pair[0] === 'Names');
  const displayName = parsedMetadata.filter(pair => pair[0] === 'Display Name');

  //Append names to main array
  if (standardName.length > 0) { label = label.concat(standardName[0][1]); }
  if (names.length > 0) { label = label.concat(names[0][1]); }
  if (displayName.length > 0) { label = label.concat(displayName[0][1]); }

  return _.compact(label);
};

//Evaluate a node for a possible query match
//Requires a valid cytoscape node
//Returns true or false
const evaluateNode = (node, matchingFn) => {
  const namesList = getNames(node);

  //Check if any of the alternative names match the query
  for (var i = 0; i < namesList.length; i++) {
    if (matchingFn(namesList[i])) {
      return true;
    }
  }
  return false;
};

const matchedStyle = {
  'overlay-color': 'yellow',
  'overlay-padding': 0,
  'overlay-opacity': 0.5  
};

const matchedScratchKey = '_matched-style-before';

//Search for nodes that match an entered query
const searchNodes = (cy, query, style = matchedStyle) => {
  const queryNonEmpty = !!_.trim(query);
  let nodes = cy.nodes();

  const allChildNodes = nodes.map(node => node.data('compoundCollapse.collapsedCollection'));
  allChildNodes.forEach(collection => nodes = nodes.union(collection));

  let caseInsensitiveValue = query.toUpperCase();
  let matched = nodes.filter(node => evaluateNode(node, name => name.toUpperCase().includes(caseInsensitiveValue)));

  removeStyle(cy, cy.nodes(), matchedScratchKey);

  if ( matched.length > 0 && queryNonEmpty) {
    applyStyle(cy, matched, style, matchedScratchKey);
  }
};

module.exports = searchNodes;