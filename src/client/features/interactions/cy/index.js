const _ = require('lodash');

const INTERACTIONS_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 20000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate: false
};

let searchInteractionNodes = _.debounce((cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let allNodes = cy.nodes();
  let matched = allNodes.filter( node => node.data('label').toUpperCase().includes( query.toUpperCase() ) );

  cy.batch(() => {
    allNodes.removeClass('matched');

    if( matched.length > 0 && !queryEmpty ){
      matched.addClass('matched');
    }
  });
}, 250);


module.exports = {
  INTERACTIONS_LAYOUT_OPTS,
  searchInteractionNodes,
  interactionsStylesheet: require('./interactions-stylesheet')
};