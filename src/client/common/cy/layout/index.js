const coseBilkentOpts = require('./coseBilkent');
const dagreOpts = require('./dagre');
const klayOpts = require('./klay');
const stratifiedLayeredOpts = require('./stratifiedKlay');

const layoutMap = new Map()
.set('Force Directed', coseBilkentOpts)
.set('Tree', dagreOpts)
.set('Layered', klayOpts)
.set('Stratified', stratifiedLayeredOpts);

const layoutDescs = {
  'Force Directed': 'Layout algorithm for undirected compound graphs',
  'Tree': 'For DAGs and trees',
  'Layered': 'Layer-based layout for node-link diagrams',
  'Stratified': 'Vertical ordering of common cellular compartments'
};

const humanLayoutName = 'Human-created';
const defaultLayout = 'Force Directed';

const layoutNames = [...layoutMap.keys()];

module.exports = {humanLayoutName, layoutDescs, layoutMap, defaultLayout, layoutNames};