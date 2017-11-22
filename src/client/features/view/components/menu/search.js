const _ = require('lodash');

//Apply hover styling to a collection of nodes
function updateStyling(style, matchedNodes) {
  matchedNodes.forEach(node => {
    let isCompartment = node.data('class') === 'compartment';

    //Collapse Expanded Targets
    if (node.isExpanded() && !isCompartment) { node.collapse(); }

    //Apply style to the parent
    if (node.isChild() && node.parent().data('class') !== 'compartment') { node = node.parent(); }

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

//Search for nodes that match an entered query
function searchNodes(query, cy) {
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
    matched = nodes.filter(node => node.data('label').match(regexObject));
  }
  //Search for an exact match
  else if (isExact) {
    let trimmedValue = query.substring(6).toUpperCase();
    matched = nodes.filter(node => node.data('label').toUpperCase() == trimmedValue);
  }
  //Search for a partial match
  else {
    let caseInsensitiveValue = query.toUpperCase();
    matched = nodes.filter(node => node.data('label').toUpperCase().includes(caseInsensitiveValue));
  }

  //Define highlighting style
  const searchStyle = {
    'overlay-color': 'yellow',
    'overlay-padding' : 0,
    'overlay-opacity': 0.5
  };

  const baseStyle = {
    'overlay-color': '#000',
    'overlay-padding' : 0,
    'overlay-opacity': '0'
  };

  //Remove all search styling
  applySearchStyle(cy.nodes(), baseStyle);

  //Apply styling
  if (matched.length > 0 && isBlank) {
    updateStyling(searchStyle, matched, cy);
    cy.fit();
  }
}

module.exports = searchNodes;