
const ENRICHMENT_MAP_LAYOUT = {
  name: 'cose-bilkent',
  nodeRepulsion: 300000,
  edgeElasticity: 0.05,
  idealEdgeLength: 200,
  animate: false,
  padding: 20
};


module.exports = {
  ENRICHMENT_MAP_LAYOUT,
  enrichmentStylesheet: require('./enrichment-stylesheet')
};