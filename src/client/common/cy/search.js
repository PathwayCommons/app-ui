const _ = require('lodash');

//Apply hover styling to a collection of nodes
function updateStyling(style, matchedNodes) {
  matchedNodes.filter(node => node.data('class') !== 'compartment').forEach(node => {
    applySearchStyle(node, style);
  });
}

//Determine if a regex pattern is valid
function validateRegex(pattern) {
  var parts = pattern.split('/'),
    regex = pattern,
    options = "";
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
}

function applySearchStyle(eles, style) {
  eles.style(style);
}

//Get all the names associated with a node
//Requires a valid cytoscape node
//Returns a list of strings
function getNames(node) {
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
}

//Evaluate a node for a possible query match
//Requires a valid cytoscape node
//Returns true or false
function evaluateNode(node, matchingFn) {

  //Get a list of names
  const namesList = getNames(node);

  //Loop and find the first match
  for (var i = 0; i < namesList.length; i++) {
    if (matchingFn(namesList[i])) {
      return true;
    }
  }
  return false;
}

//Search for nodes that match an entered query
function searchNodes(query, cy, fit = false) {
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

  //Define highlighting style
  const searchStyle = {
    'overlay-color': 'yellow',
    'overlay-padding': 0,
    'overlay-opacity': 0.5
  };

  const baseStyle = {
    'overlay-color': '#000',
    'overlay-padding': 0,
    'overlay-opacity': '0'
  };

  //Remove all search styling
  applySearchStyle(cy.nodes(), baseStyle);

  //Apply styling
  if ( matched.length > 0 && isBlank) {

    if (fit) {
      cy.animate({
        fit: {
          eles: cy.elements(), padding: 100
        }
      }, { duration: 700 });
    }

    updateStyling(searchStyle, matched, cy);
  }
}

module.exports = searchNodes;