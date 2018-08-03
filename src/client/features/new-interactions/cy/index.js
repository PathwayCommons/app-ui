const INTERACTIONS_LAYOUT_OPTS = {
  name: 'cose-bilkent',
  nodeRepulsion: 20000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate:false
};


module.exports = {
  INTERACTIONS_LAYOUT_OPTS,
  interactionsStylesheet: require('./interactions-stylesheet')
};