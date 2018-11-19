const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/cytoscape-tooltip');
const _ = require('lodash');

const EnrichmentTooltip = require('../enrichment-tooltip');

const { ServerAPI } = require('../../../services');

const ENRICHMENT_MAP_LAYOUT = {
  name: 'cose-bilkent',
  nodeRepulsion: 1000,
  edgeElasticity: 1,
  idealEdgeLength: 150,
  animate: 'end',
  animationEasing: 'ease-in-out',
  animationDuration: 800,
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
        html: h(EnrichmentTooltip, {
          node: node,
          overviewDesc: pathwayOverview
          })
      } );
      node.scratch('_tooltip', tooltip);
      tooltip.show();
    })
    .catch( () => {
      let tooltip = new CytoscapeTooltip( node.popperRef(), {
        html: h(EnrichmentTooltip, {
          node: node,
          overviewDesc: 'Information not available'
          })
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

  let nodeHoverMouseOver = _.debounce(evt => {
    let node = evt.target;
    let elesToHighlight = cy.collection();

    //Create a list of the hovered node & its neighbourhood
    node.neighborhood().nodes().union(node).forEach(node => {
      elesToHighlight.merge(node.ancestors());
      elesToHighlight.merge(node.descendants());
      elesToHighlight.merge(node);
    });
    elesToHighlight.merge(node.neighborhood().edges());

    //Add highlighted class to node & its neighbourhood, unhighlighted to everything else
    cy.elements().addClass('unhighlighted');
    elesToHighlight.forEach(ele => {
      ele.removeClass('unhighlighted');
      ele.addClass('highlighted');
    });

  }, 200);

  //call style-applying and style-removing functions on 'mouseover' and 'mouseout' for non-compartment nodes
  cy.on('mouseover', 'node[class!="compartment"]', nodeHoverMouseOver);
  cy.on('mouseout', 'node[class!="compartment"]', () => {
    nodeHoverMouseOver.cancel();
    cy.elements().removeClass('highlighted unhighlighted');
  });
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