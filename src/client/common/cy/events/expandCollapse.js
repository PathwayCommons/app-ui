const bindExpandCollapse = (cy, callback) => {
  cy.on('expandCollapse', 'node[class="complex"], node[class="complex multimer"]', function (evt) {
    evt.preventDefault();
    const node = evt.target;

    node.isCollapsed() ? node.expand() : node.collapse();
  });

  cy.on('compoundCollapse.afterExpand', function (evt) {
    const node = evt.target;
    cy.zoomingEnabled(false);
    node.children().layout({
      name:'grid',
      fit: 'false',
      avoidOverlap: true,
      condense: true,
      animate: true,
      rows: Math.floor(Math.sqrt(node.children().size())),
      cols: Math.floor(Math.sqrt(node.children().size())),
      boundingBox: node.boundingBox({
        includeLabels: false
      })
    }).run();
    cy.zoomingEnabled(true);

  });

};

module.exports = bindExpandCollapse;