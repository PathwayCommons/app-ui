const layouts = [
  {
    displayName: 'Force Directed',
    description: 'Layout algorithm for undirected compound graphs',
    options: {
      name: 'cose-bilkent',
      nodeDimensionsIncludeLabels: true,
      tilingPaddingVertical: 20,
      tilingPaddingHorizontal: 20,
      fit: true,
      randomize: false
    }
  },
  {
    displayName: 'Tree',
    description: 'For DAGs and trees',
    options: {
      name: 'dagre',
      rankDir: 'LR',
      animate: true,
      animationDuration: 500
    }
  },
  {
    displayName: 'Layered',
    description: 'Layer-based layout for node-link diagrams',
    options: {
      name: 'klay',
      animate: true,
      animationDuration: 500,
      klay: {
        borderSpacing: 10,
        separateConnectedComponents: true,
        thoroughness: 100,
        compactComponents: false,
        spacing: 40,
        edgeSpacingFactor: 2.0,

        layoutHierarchy: true
      },
      nodeDimensionsIncludeLabels: false
    }
  },
  {
    displayName: 'Stratified',
    description:'Vertical ordering of common cellular compartments',
    options: {
      name: 'klay',
      animate: true,
      animationDuration: 500,
      klay: {
        borderSpacing: 10,
        separateConnectedComponents: false,
        thoroughness: 1000,
        compactComponents: false,
        spacing: 60,
        edgeSpacingFactor: 0.5,
        layoutHierarchy: false
      },
      nodeDimensionsIncludeLabels: true
    }
  }
];


const getLayouts = (presetLayoutJSON) => {
  const humanCreatedLayout = {
    name: 'preset',
    displayName: 'Human-created',
    description: 'Only the best layouts sourced by top biologists',
    options: {
      name: 'preset',
      positions: node => presetLayoutJSON[node.id()],
      animate: true,
      animationDuration: 500
    }
  };

  const layoutConfig = {
    defaultLayout: 'Force Directed'
  };

  if (presetLayoutJSON == null) {
    layoutConfig.layouts = layouts;
  } else {
    layoutConfig.defaultLayout = 'Human-created';
    layoutConfig.layouts = [humanCreatedLayout].concat(layouts);
  }

  return layoutConfig;
};


module.exports = getLayouts;