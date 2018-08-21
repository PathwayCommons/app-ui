const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/cytoscape-tooltip');
const _ = require('lodash');

const InteractionsTooltip = require('../interactions-tooltip');

const INTERACTIONS_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 20000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate: false
};

const SHOW_INTERACTIONS_TOOLTIPS_EVENT = 'showinteractionstooltip';

let bindEvents = cy => {
  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      let tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
      }
    });
  };

  cy.on(SHOW_INTERACTIONS_TOOLTIPS_EVENT, 'node', function (evt) {
    let node = evt.target;
    let tooltip = new CytoscapeTooltip( node.popperRef(), {
      html: h(InteractionsTooltip, {
        node: node
        })
    } );
    node.scratch('_tooltip', tooltip);
    tooltip.show();
  });

  cy.on('tap', evt => {
    const tgt = evt.target;

    // if we didn't click a node, close all tooltips
    if( evt.target === cy || evt.target.isEdge() ){
      hideTooltips();
      return;
    }

    // we clicked a node that has a tooltip open -> close it
    if( tgt.scratch('_tooltip')){
      hideTooltips();
      tgt.removeScratch('_tooltip');
    } else {
      // open the tooltip for the clicked node
      hideTooltips();
      tgt.emit(SHOW_INTERACTIONS_TOOLTIPS_EVENT);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', () => hideTooltips());
  cy.on('pan', () => hideTooltips());
  cy.on('zoom', () => hideTooltips());
  cy.on('layoutstart', () => hideTooltips());
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
  interactionsStylesheet: require('./interactions-stylesheet'),
  bindEvents
};