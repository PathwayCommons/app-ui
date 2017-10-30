const stratifiedLayeredOpts = {
  name: 'klay',
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
};

module.exports = stratifiedLayeredOpts;
