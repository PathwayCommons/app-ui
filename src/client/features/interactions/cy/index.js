const _ = require('lodash');

const INTERACTIONS_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 20000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate: false
};

let searchInteractionNodes = (cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let allNodes = cy.nodes();
  let matched = cy.nodes().filter( node => node.data('label').toUpperCase().includes( query.toUpperCase() ) );

  allNodes.removeClass('matched')
  if( matched.length > 0 && !queryEmpty ){
    matched.addClass('matched');
  }
};


module.exports = {
  INTERACTIONS_LAYOUT_OPTS,
  searchInteractionNodes,
  interactionsStylesheet: require('./interactions-stylesheet')
};