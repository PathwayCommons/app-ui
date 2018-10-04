const _ = require('lodash');
const { PATHWAYS_LAYOUT_OPTS } = require('./layout');


const MATCHED_SEARCH_CLASS = 'search-match';

let expandCollapseAll = () => {
  let expanded = true;

  return cy => {
    let api = cy.expandCollapse('get');

    if( expanded ){
      let nodesToCollapse = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isCollapsible(node));
      api.collapseRecursively(nodesToCollapse);
  
    } else {
      let nodesToExpand = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isExpandable(node));
      api.expandRecursively(nodesToExpand);
    }
    expanded = !expanded;
  };
};

let fit = cy => {
  cy.animation({ duration: 250, fit: { padding: 75 }}).play();
};

let layout = cy => {
  cy.layout(PATHWAYS_LAYOUT_OPTS).run();
};

let searchNodes = (cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let ecAPI = cy.expandCollapse('get');
  let allNodes = cy.nodes().union(ecAPI.getAllCollapsedChildrenRecursively());

  let getSynonyms = node => {
    let parsedMetadata = node.data('parsedMetadata');
    let geneSynonyms = node.data('geneSynonyms');
    let labels = node.data('label')? [node.data('label')]:[node.data('description')];
  
    if (!parsedMetadata) return labels;
  
    //Get Various Names
    let standardName = parsedMetadata.filter(pair => pair[0] === 'Standard Name');
    let names = parsedMetadata.filter(pair => pair[0] === 'Names');
    let displayName = parsedMetadata.filter(pair => pair[0] === 'Display Name');
  
    //Append names to main array
    if (standardName.length > 0){ labels = labels.concat(standardName[0][1]); }
    if (names.length > 0){ labels = labels.concat(names[0][1]); }
    if (displayName.length > 0){ labels = labels.concat(displayName[0][1]); }
  
    if(_.isArray(geneSynonyms)){ labels = labels.concat(node.data('geneSynonyms')); }
  
    return labels.filter(synonym => synonym != null);
  };

  let matched = allNodes.filter(node => {
    let synonyms = getSynonyms(node).filter( synonym => synonym != null);

    let synonymMatch = synonyms.find( synonym => synonym.toUpperCase().includes( query.toUpperCase() ));

    return synonymMatch != null;
  });

  allNodes.removeClass(MATCHED_SEARCH_CLASS);

  if ( matched.length > 0 && !queryEmpty ) {
    matched.addClass(MATCHED_SEARCH_CLASS);
  }
};

module.exports = {
  expandCollapse: expandCollapseAll(),
  fit,
  layout,
  searchNodes: _.debounce(searchNodes, 300),
  MATCHED_SEARCH_CLASS
};