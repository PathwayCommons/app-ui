const _ = require('lodash');

const {applyStyle, removeStyle} = require('./manage-style');

//Determine if a regex pattern is valid
const validateRegex = (pattern) => {
  let parts = pattern.split('/');
  let regex = pattern;
  let options = '';

  if (parts.length > 1) {
    regex = parts[1];
    options = parts[2];
  }
  try {
    let regexObj = new RegExp(regex, options);
    return regexObj;
  }
  catch (e) {
    return null;
  }
};

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

  //Get a list of names
  const namesList = getNames(node);

  //Loop and find the first match
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
const searchNodes = (query, cy, fit = false, style = matchedStyle) => {
  
  const isBlank = _.isString(query) ? !!_.trim(query) : false;
  const isRegularExp = _.startsWith(query, 'regex:') && validateRegex(query.substring(6));
  const isExact = _.startsWith(query, 'exact:');

  let nodes = cy.nodes();

  //Get all child nodes
  const allChildNodes = nodes.map(node => node.data('compoundCollapse.collapsedCollection'));

  //Add all child nodes to the main node search list
  allChildNodes.forEach(collection => nodes = nodes.union(collection));

  let matched;

  //Search based on regular expression
  if (isRegularExp) {
    let regexObject = validateRegex(query.substring(6));
    matched = nodes.filter(node => evaluateNode(node, name => name.match(regexObject)));
  }
  //Search for an exact match
  else if (isExact) {
    let trimmedValue = query.substring(6).toUpperCase();
    matched = nodes.filter(node => evaluateNode(node, name => name.toUpperCase() === trimmedValue));
  }
  //Search for a partial match
  else {
    let caseInsensitiveValue = query.toUpperCase();
    matched = nodes.filter(node => evaluateNode(node, name => name.toUpperCase().includes(caseInsensitiveValue)));
  }

  removeStyle(cy, cy.nodes(), matchedScratchKey);
  console.log(style);
  //Apply styling
  if ( matched.length > 0 && isBlank) {

    if (fit) {
      cy.animate({
        fit: {
          eles: cy.elements(), padding: 100
        }
      }, { duration: 700 });
    }

    console.log(cy, matched, style, matchedScratchKey);

    applyStyle(cy, matched, style, matchedScratchKey);
  }
};

module.exports = searchNodes;