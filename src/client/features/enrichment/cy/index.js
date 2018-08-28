const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/cytoscape-tooltip');
const _ = require('lodash');

const EnrichmentNodeTooltip = require('../enrichment-node-tooltip');
const EnrichmentEdgeTooltip = require('../enrichment-edge-tooltip');

const { ServerAPI } = require('../../../services');

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
    let getEnrichmentTooltipData = () => {
      let id = node.data('id');

      if( /^GO:\d+$/.test(id) ) return ServerAPI.getGoInformation( id.replace("GO:", "") );
      else if( /^REAC:\d+$/.test(id) ) return ServerAPI.getReactomeInformation( id.replace("REAC:", "R-HSA-") );
      else return Promise.resolve(null);
    };

    getEnrichmentTooltipData().then( result => {
      //default
      let pathwayOverview = 'Information not available';
      //successful GO API call
      if(result && result.numberOfHits) pathwayOverview = result.results[0].definition.text;
      //successful Reactome API call
      else if(result && result.summation) pathwayOverview = result.summation[0].text;

      let tooltip = new CytoscapeTooltip( node.popperRef(), {
        html: h(EnrichmentNodeTooltip, {
          node: node,
          overviewDesc: pathwayOverview
          })
      } );
      node.scratch('_tooltip', tooltip);
      tooltip.show();
    })
    .catch( () => {
      let tooltip = new CytoscapeTooltip( node.popperRef(), {
        html: h(EnrichmentNodeTooltip, {
          node: node,
          overviewDesc: 'Information not available'
          })
      } );
      node.scratch('_tooltip', tooltip);
      tooltip.show();
    });
  });

  cy.on(SHOW_ENRICHMENT_TOOLTIPS_EVENT, 'edge', function (evt) {
    let edge = evt.target;
    let tooltip = new CytoscapeTooltip( edge.popperRef(), {
      html: h(EnrichmentEdgeTooltip, {
        edge: edge
        })
    } );
    edge.scratch('_tooltip', tooltip);
    tooltip.show();
  });

  cy.on('tap', evt => {
    const tgt = evt.target;

    // if we didn't click an element, close all tooltips
    if( evt.target === cy ){
      hideTooltips();
      return;
    }

    // we clicked an element that has a tooltip open -> close it
    if( tgt.scratch('_tooltip') ){
      hideTooltips();
      tgt.removeScratch('_tooltip');
    } else {
      // open the tooltip for the clicked element
      hideTooltips();
      tgt.emit(SHOW_ENRICHMENT_TOOLTIPS_EVENT);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', () => hideTooltips());
  cy.on('pan', () => hideTooltips());
  cy.on('zoom', () => hideTooltips());
  cy.on('layoutstart', () => hideTooltips());
  cy.on('slider-change', () => hideTooltips());
};

let searchEnrichmentNodes = _.debounce((cy, query) => {
  let queryEmpty = _.trim(query) === '';
  let allNodes = cy.nodes();
  let matched = allNodes.filter( node =>
    node.data('geneSet').join(' ').includes( query.toUpperCase() ) || node.data('description').toUpperCase().includes( query.toUpperCase() )
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