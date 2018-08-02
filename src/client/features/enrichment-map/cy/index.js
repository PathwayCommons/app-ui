const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/tooltips/cytoscape-tooltip');

const EnrichmentTooltip = require('../enrichment-tooltip');

const ENRICHMENT_MAP_LAYOUT = {
  name: 'cose-bilkent',
  nodeRepulsion: 300000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate: false,
  padding: 20
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
    // todo get enrichment node tooltip data
    let getEnrichmentTooltipData = () => {

    };

    getEnrichmentTooltipData().then( data => {
      let tooltip = new CytoscapeTooltip( node.popperRef(), {
        html: h(EnrichmentTooltip, data)
      } );
      node.scratch('_tooltip', tooltip);
      tooltip.show();
    });
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


module.exports = {
  ENRICHMENT_MAP_LAYOUT,
  enrichmentStylesheet: require('./enrichment-stylesheet'),
  bindEvents
};