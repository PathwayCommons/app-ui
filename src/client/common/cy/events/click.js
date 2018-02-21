//Hide all Tooltips
//Requires a valid cytoscape element
const hideTooltips = (cy) => {
  cy.nodes().union(cy.edges()).forEach(node => {
    const tooltip = node.scratch('_tooltip');
    if (tooltip) { tooltip.hide(); }
  });
};

const bindClick = (cy) => {

  cy.on('tap', 'node,edge.Binding,edge.Phosphorylation,edge.Expression', evt => {
    const cy = evt.cy;
    const node = evt.target;

    if (!node.scratch('_tooltip-opened')) {
      node.emit('showTooltip');
      node.scratch('_tooltip-opened', true);
    } else {
      hideTooltips(cy);
      node.scratch('_tooltip-opened', false);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', evt => hideTooltips(evt.cy));
  cy.on('pan', evt => hideTooltips(evt.cy));
  cy.on('zoom', evt => hideTooltips(evt.cy));
};

module.exports = { bindClick, hideTooltips };