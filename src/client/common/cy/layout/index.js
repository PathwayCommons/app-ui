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
    padding: 100,
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