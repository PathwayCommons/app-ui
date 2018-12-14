const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/cytoscape-tooltip');
const _ = require('lodash');

const EnrichmentTooltip = require('../enrichment-tooltip');

const ENRICHMENT_MAP_LAYOUT = {
  name: 'cola',
  refresh: 10,
  animate: false,
  maxSimulationTime: 500,
  nodeDimensionsIncludeLabels: true,
  randomize: true,
  convergenceThreshold: 50,
  padding: 50
};

const SHOW_ENRICHMENT_TOOLTIPS_EVENT = 'showenrichmenttooltip';

let bindEvents = cy => {
  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      let tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
      }
    });
  };

  cy.on(SHOW_ENRICHMENT_TOOLTIPS_EVENT, 'node[class != "compartment"]', function (evt) {
    let node = evt.target;
    let tooltip = new CytoscapeTooltip( node.popperRef(), {
      html: h(EnrichmentTooltip, {
        node: node,
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
    if( tgt.scratch('_tooltip-opened') ){
      hideTooltips();
    } else {
      // open the tooltip for the clicked node
      hideTooltips();
      tgt.emit(SHOW_ENRICHMENT_TOOLTIPS_EVENT);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', () => hideTooltips());
  cy.on('pan', () => hideTooltips());
  cy.on('zoom', () => hideTooltips());
  cy.on('layoutstart', () => hideTooltips());
};

let searchEnrichmentNodes = _.debounce((cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let allNodes = cy.nodes();
  let matched = allNodes.filter( node =>
    node.data('geneSet').join(' ').includes( query.toUpperCase() ) || node.data('name').toUpperCase().includes( query.toUpperCase() )
  );

  cy.batch(() => {
    allNodes.removeClass('matched');
    if( matched.length > 0 && !queryEmpty ){
      matched.addClass('matched');
    }
  });
}, 250);

module.exports = {
  ENRICHMENT_MAP_LAYOUT,
  searchEnrichmentNodes,
  enrichmentStylesheet: require('./enrichment-stylesheet'),
  bindEvents
};