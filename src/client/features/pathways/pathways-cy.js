const cytoscape = require('cytoscape');
const sbgnStyleSheet = require('cytoscape-sbgn-stylesheet');

const DEFAULT_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 5000,
  nodeDimensionsIncludeLabels: true,
  tilingPaddingVertical: 20,
  tilingPaddingHorizontal: 20,
  animate: true,
  animationDuration: 500,
  fit: true,
  padding: 75,
  randomize: false
};

const EXPAND_COLLAPSE_OPTS = {
  layoutBy: DEFAULT_LAYOUT_OPTS,
  fisheye: true,
  animate: true,
  undoable: false,
  cueEnabled: false
};

let expandCollapseAll = () => {
  let expanded = true;

  return cy => {
    let api = cy.expandCollapse('get');

    if( expanded ){
      let nodesToCollapse = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isCollapsible(node));
      api.collapseRecursively(nodesToCollapse);
  
    } else {
      let nodesToExpand = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isExpandable(node));
      api.expandRecursively(nodesToExpand);
    }
    expanded = !expanded;
  };
};

let fit = cy => {
  cy.animation({ duration: 250, fit: { padding: 75 }}).play();
};

let layout = cy => {
  cy.layout(DEFAULT_LAYOUT_OPTS).run();
};

let bindPathwaysEvents = cy => {
  cy.expandCollapse(EXPAND_COLLAPSE_OPTS);
};

let stylesheet = sbgnStyleSheet(cytoscape)
.selector('node')
.css({
  'background-opacity': '0.4'
})
.selector('node:active')
.css({
  'background-opacity': '0.7',
})
.selector('node[class!="compartment"]')
.css({
  'font-size': 20,
  'color': 'black',
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-outline-opacity': 0.5,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'label': node => {
    const label = node.data('label')
      .split('(').join('').split(')').join('')
      .split(':').join(' ');
    return label;
  }
})
.selector('node[class="complex"]')
.css({
  'width': 45,
  'height': 45,
  'label': node => node.isParent() ? '' : node.data('label')
})
.selector('.compoundcollapse-collapsed-node')
.css({
  'font-size': 20,
  'text-max-width': 175
})
.selector('edge')
.css({
  'opacity': 0.3
})
.selector('node[class="and"],node[class="or"],node[class="not"]')
.css({
  'label':node=>node.data('class')
})
.selector('.hidden')
.css({
  'display':'none',
});

module.exports = {
  expandCollapse: expandCollapseAll(),
  fit,
  layout,
  stylesheet,
  bindPathwaysEvents,
  DEFAULT_LAYOUT_OPTS
};