const _ = require('lodash');

//Apply hover styling to a collection of nodes
function updateStyling(style, matched, cy) {
  for (var i = 0; i < matched.length; i++) {
    let node = matched[i];
    let isCompartment = node.data('class') === 'compartment';

    //Collapse Expanded Targets
    if (node.isExpanded() && !isCompartment) { node.collapse(); }

    //Apply style to the parent
    if (node.isChild() && node.parent().data('class') !== 'compartment') { node = node.parent(); }

    applySearchStyle(cy, node, style);
  }
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

function applySearchStyle(cy, eles, style) {
  eles.style(style);
}

//Search for nodes that match an entered query
function searchNodes(query, cy) {
  const searchValue = query.target.value;
  const isBlank = _.isString(searchValue) ? !!_.trim(searchValue) : false;
  const isRegularExp = _.startsWith(searchValue, 'regex:') && validateRegex(searchValue.substring(6));
  const isExact = _.startsWith(searchValue, 'exact:');

  let visibleNodes = Array.prototype.slice.call(cy.nodes(), 0);

  //Add children of nodes to nodes list
  const allChildNodes = visibleNodes.map(node => node.data('compoundCollapse.collapsedCollection'));
  const validChildNodes = _.compact(_.flattenDeep(allChildNodes.map(collection => collection ? Array.prototype.slice.call(collection, 0) : null)));
  const nodes = _.union(visibleNodes, validChildNodes);

  let matched;

  //Search based on regular expression
  if (isRegularExp) {
    let regexObject = validateRegex(searchValue.substring(6));
    matched = nodes.filter(node => node.data('label').match(regexObject));
  }
  //Search for an exact match
  else if (isExact) {
    let trimmedValue = searchValue.substring(6).toUpperCase();
    matched = nodes.filter(node => node.data('label').toUpperCase() == trimmedValue);
  }
  //Search for a partial match
  else {
    let caseInsensitiveValue = searchValue.toUpperCase();
    matched = nodes.filter(node => node.data('label').toUpperCase().includes(caseInsensitiveValue));
  }

  //Define highlighting style
  const searchStyle = {
    'overlay-color': 'yellow',
    'overlay-opacity': 0.5
  };

  const baseStyle = {
    'overlay-color': '#000',
    'overlay-opacity': '0'
  };

  //Remove all search styling
  applySearchStyle(cy, cy.nodes(), baseStyle);

  //Apply styling
  if (matched.length > 0 && isBlank) {
    updateStyling(searchStyle, matched, cy);
    cy.fit();
  }
  else {
    cy.fit();
  }
}

module.exports = searchNodes;