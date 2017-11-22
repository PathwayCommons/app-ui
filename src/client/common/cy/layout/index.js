const coseBilkentOpts = require('./coseBilkent');
const dagreOpts = require('./dagre');
const klayOpts = require('./klay');
const stratifiedLayeredOpts = require('./stratifiedKlay');

const coseBilkentMaxGraphSize = 100;

const humanLayoutName = 'Human-created';

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

const defaultLayout = 'Layered';

const layoutNames = (graphSize) => {
  let defaults = [...layoutMap.keys()];

  if (graphSize >= coseBilkentMaxGraphSize) {
    const index = defaults.indexOf('Force Directed 2');

    if (index > -1) {
      defaults.splice(index, 1);
    }
  }

  return defaults;
};

const getDefaultLayout = (graphSize) => {
  let layout = 'Layered';

  if (graphSize<= coseBilkentMaxGraphSize) {
    layout = 'Force Directed';
  }

  return layout;
};

module.exports = {humanLayoutName, layoutDescs, layoutMap, defaultLayout, layoutNames, getDefaultLayout};