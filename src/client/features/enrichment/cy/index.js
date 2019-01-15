const h = require('react-hyperscript');
const CytoscapeTooltip = require('../../../common/cy/cytoscape-tooltip');
const _ = require('lodash');

const EnrichmentTooltip = require('../enrichment-tooltip');

const { generateClusterLabels } = require('./cluster-label-categorization');


const SHOW_ENRICHMENT_TOOLTIPS_EVENT = 'showenrichmenttooltip';
const ENRICHMENT_LAYOUT_OPTS = {
  name: 'cola',
  refresh: 10,
  animate: false,
  maxSimulationTime: 500,
  nodeDimensionsIncludeLabels: true,

  randomize: true,
  convergenceThreshold: 50,
  padding: 50
};

let enrichmentLayout = cy => {
  let nodesWithNoEdges = cy.nodes().filter( node => node.connectedEdges().size() === 0 );
  let nodesWithEdges = cy.elements().difference( nodesWithNoEdges );
  let w = cy.width();
  let h = cy.height();

  let firstLayout = nodesWithEdges.layout(ENRICHMENT_LAYOUT_OPTS);
  let firstLayoutPromise = firstLayout.pon('layoutstop');
  firstLayout.run();

  return firstLayoutPromise.then( () => {

    // add parent nodes for each component with size > 2
    cy.elements().components().filter( component => component.size() > 2 ).forEach( (component, index) => {
      let labelInput = component.nodes().map(node => node.data('name')).join('. ');
      let tags = generateClusterLabels(labelInput);

      let componentParentId = 'component-' + index;
      cy.add({
        group: 'nodes',
        label: '',
        data: {
          tags: tags.join(' '),
          id: componentParentId
        },
      });

      component.move({
        parent: componentParentId
      });
    });


    let firstLayoutBB = nodesWithEdges.boundingBox();
    let bbIsEmpty = bb => bb.h === 0 && bb.w === 0;

    let secondLayoutBB = {
      x1: 0,
      x2: w,
      y1: 0,
      y2: h
    };

    if( !bbIsEmpty( firstLayoutBB ) ){
      secondLayoutBB = {
        x1: firstLayoutBB.x1,
        x2: firstLayoutBB.x2,
        y1: firstLayoutBB.y2 + 200,
        y2: firstLayoutBB.y2 + 400
      };
    }

    let secondLayout = nodesWithNoEdges.layout({
      name: 'grid',
      nodeDimensionsIncludeLabels: true,
      boundingBox: secondLayoutBB,
      stop: () => cy.fit([], Math.min(0.05 * h, 0.05 * w))
    });
    let secondLayoutPromise = secondLayout.pon('layoutstop');
    secondLayout.run();

    return secondLayoutPromise;
  });
};


let bindEvents = cy => {
  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      let tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
      }
    });
  };

  cy.on(SHOW_ENRICHMENT_TOOLTIPS_EVENT, 'node', function (evt) {
    let node = evt.target;

    if( node.isParent() ){ return; }

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
  enrichmentLayout,
  searchEnrichmentNodes,
  enrichmentStylesheet: require('./enrichment-stylesheet'),
  bindEvents
};