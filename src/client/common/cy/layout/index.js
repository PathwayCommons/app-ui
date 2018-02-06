const pcGraphLayoutHack = (cy, layoutOpts) => {
  const complexes = cy.nodes().filter(node => node.isParent() && node.data('class') === 'complex');
  complexes.forEach(node => {
    if (!node.isParent()) { return; }
    node.children().layout({
      name: 'grid',
      fit: false,
      avoidOverlap: true,
      condense: true,
      rows: Math.floor(Math.sqrt(node.children().size())),
      cols: Math.floor(Math.sqrt(node.children().size()))}).run();
    node.scratch('_bb', node.boundingBox());
    node.scratch('_children', node.children());
    node.children().remove();
    node.style({width: node.scratch('_bb').w, height: node.scratch('_bb').h});
  });
  const layout = cy.layout(layoutOpts);
  layout.pon('layoutstop', () => {
    complexes.forEach(node => {
      node.scratch('_children').position(node.position());
      node.scratch('_children').restore();
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

  });
  layout.run();
};


const defaultLayout = {
  displayName: 'Force Directed',
  description: 'For undirected compound graphs',
  options: {
    name: 'cose-bilkent',
    nodeDimensionsIncludeLabels: true,
    tilingPaddingVertical: 20,
    tilingPaddingHorizontal: 20,
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 75,
    randomize: false
  }
};

const getLayoutConfig = (presetLayoutJSON) => {
  const humanCreatedLayout = {
    name: 'preset',
    displayName: 'Human-created',
    description: '',
    options: {
      name: 'preset',
      positions: node => presetLayoutJSON[node.id()],
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 100
    }
  };

  let layoutConfig;
  if (presetLayoutJSON == null) {
    layoutConfig = {
      defaultLayout: defaultLayout,
      layouts: [defaultLayout]
    };
  } else {
    layoutConfig = {
      defaultLayout: humanCreatedLayout,
      layouts: [humanCreatedLayout, defaultLayout]
    };
  }

  return layoutConfig;
};

const applyHumanLayout = (cy, layoutJSON, animateOpts = {}) => {
  const nodeIds = Object.keys(layoutJSON);

  nodeIds.forEach(id => {
    const node = cy.getElementById(id);
    const pos = layoutJSON[id];

    if (!node.isParent()) {
      node.position(pos);
    }
  });

  cy.animate(animateOpts);
};

module.exports = { getLayoutConfig, applyHumanLayout };
