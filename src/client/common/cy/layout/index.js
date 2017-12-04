const layouts = [
  {
    displayName: 'Force Directed',
    description: 'For undirected compound graphs',
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
    description: 'For DAGs',
    options: {
      name: 'dagre',
      rankDir: 'LR',
      animate: true,
      animationDuration: 500
    }
  },
  {
    displayName: 'Layered',
    description: 'For node-link diagrams',
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

const humanLayoutDisplayName = 'Human-created';

const getLayouts = (presetLayoutJSON) => {
  const humanCreatedLayout = {
    name: 'preset',
    displayName: humanLayoutDisplayName,
    description: '',
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
    layoutConfig.defaultLayout = humanLayoutDisplayName;
    layoutConfig.layouts = [humanCreatedLayout].concat(layouts);
  }

  return layoutConfig;
};


module.exports = { getLayouts, humanLayoutDisplayName };