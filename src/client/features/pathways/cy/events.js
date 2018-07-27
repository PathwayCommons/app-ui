
const PathwayNodeMetadataTip = require('./pathway-node-metadata-tooltip');
const { PATHWAYS_LAYOUT_OPTS } = require('./layout');

const EXPAND_COLLAPSE_OPTS = {
  layoutBy: PATHWAYS_LAYOUT_OPTS,
  fisheye: true,
  animate: true,
  undoable: false,
  cueEnabled: false
};

const SHOW_TOOLTIPS_EVENT = 'showtooltip';

let bindCyEvents = cy => {

  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      const tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
        ele.scratch('_tooltip-opened', false);
      }
    });
  };

  cy.expandCollapse(EXPAND_COLLAPSE_OPTS);
  cy.on(SHOW_TOOLTIPS_EVENT, 'node', function (evt) {
    const node = evt.target;

    if(node.data('class') !== "compartment"){
      //Create or get tooltip HTML object
      let tooltip = node.scratch('_tooltip');
      if (!(tooltip)) {
        tooltip = new PathwayNodeMetadataTip(node);
        node.scratch('_tooltip', tooltip);
      }
      tooltip.show();
      node.scratch('_tooltip-opened', true);
    }
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
      tgt.emit(SHOW_TOOLTIPS_EVENT);  
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', () => hideTooltips());
  cy.on('pan', () => hideTooltips());
  cy.on('zoom', () => hideTooltips());  
};

module.exports = bindCyEvents;