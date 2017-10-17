const siblings = (node) => {
  return node.isChild() ? node.siblings().union(node.siblings().descendants()) : node._private.cy.nodes();
};

const bindExpandCollapse = (cy) => {
  cy.on('tap', 'node[class="complex"], node[class="complex multimer"]', function (evt) {
    evt.preventDefault();
    const node = evt.target;
    if (node.isCollapsed()) {
      node.expand();
    } else {
      const s = siblings(node);
      s.forEach(sibling => {
        sibling.animate({
          position: sibling.scratch('_fisheye-pos-before'),
          complete: () => {
            sibling.removeScratch('_fisheye-pos-before');
          }
        });
      });

      node.collapse();
    }
  });

  cy.on('compoundCollapse.beforeExpand', function (evt) {
    const node = evt.target;
    const s = siblings(node);

    s.forEach(sibling => {
      sibling.scratch('_fisheye-pos-before', {x: sibling.position('x'), y: sibling.position('y')});
    });

    s.layout({
      name: 'fisheye',
      focus: node.position(),
      animate: true,
      distortionFactor: 0.5
    }).run();
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