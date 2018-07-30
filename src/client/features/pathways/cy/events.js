const _ = require('lodash');

const PathwayNodeMetadataTip = require('./pathway-node-metadata-tooltip');
const ExpandCollapseCue = require('./expand-collapse-cue');
const { PATHWAYS_LAYOUT_OPTS } = require('./layout');

const EXPAND_COLLAPSE_OPTS = {
  layoutBy: _.assign({}, PATHWAYS_LAYOUT_OPTS, { fit: false }),
  fisheye: true,
  animate: true,
  undoable: false,
  cueEnabled: false
};

const SHOW_TOOLTIPS_EVENT = 'showtooltip';

let bindCyEvents = cy => {

  let hideTooltips = () => {
    cy.elements().forEach(ele => {
      let tooltip = ele.scratch('_tooltip');
      if (tooltip) {
        tooltip.hide();
      }
    });
  };

  let hideCues = () => {
    cy.elements().forEach( ele => {
      let cue = ele.scratch('_expandcollapsecue');
      if( cue ){
        cue.hide();
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
  cy.on('layoutstart', () => hideTooltips());

  let nodeHoverExpandCollapse = _.debounce(evt => {
    let node = evt.target;
    let parent = node.parent();
    let ecAPI = cy.expandCollapse('get');

    if( ecAPI.isCollapsible(node) || ecAPI.isExpandable(node) ){
      hideCues();
      let ecCue = node.scratch('_expandcollapsecue');
      if( !ecCue ){
        ecCue = new ExpandCollapseCue(node);
        node.scratch('_expandcollapsecue', ecCue);
      }
      ecCue.show();
    } else {
      let ecCue = parent.scratch('_expandcollapsecue');
      if( !ecCue ){
        ecCue = new ExpandCollapseCue(node);
        node.scratch('_expandcollapsecue', ecCue);
      }
      ecCue.show();
    }

  }, 200);

  cy.on('mouseover', '$node > node', nodeHoverExpandCollapse);

  cy.on('mouseover', '.cy-expand-collapse-collapsed-node', nodeHoverExpandCollapse);

  cy.on('drag', () => hideCues());
  cy.on('pan', () => hideCues());
  cy.on('zoom', () => hideCues());
  cy.on('layoutstart', () => hideCues());



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


//call style-applying and style-removing functions on 'mouseover' and 'mouseout' for non-compartment nodes
cy.on('mouseover', 'node[class!="compartment"]', nodeHoverMouseOver);
cy.on('mouseout', 'node[class!="compartment"]', () => {
  nodeHoverMouseOver.cancel();
  cy.elements().removeClass('highlighted unhighlighted');
});
};

module.exports = bindCyEvents;