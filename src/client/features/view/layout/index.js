const colaOpts = require('./cola.js');
const coseBilkentOpts = require('./coseBilkent.js');
const dagreOpts = require('./dagre.js');
const klayOpts = require('./klay.js');
const stratifiedLayeredOpts = require('./stratifiedKlay.js');

const coseBilkentMaxGraphSize = 100;

const layoutMap = new Map()
.set('tree / hierarchical (dagre)', dagreOpts)
.set('layered (klay)', klayOpts)
.set('stratified', stratifiedLayeredOpts)
.set('force directed (cola)', colaOpts)
.set('force directed (CoSE-Bilkent)', coseBilkentOpts);

const defaultLayout = 'layered (klay)';

const layoutNames = (graphSize) => {
  let defaults = [...layoutMap.keys()];

  if (graphSize >= coseBilkentMaxGraphSize) {
    const index = defaults.indexOf('force directed (CoSE-Bilkent)');

    if (index > -1) {
      defaults.splice(index, 1);
    }
  }

  return defaults;
};

const getDefaultLayout = (graphSize) => {
  let layout = 'layered (klay)';

  if (graphSize<= coseBilkentMaxGraphSize) {
    layout = 'force directed (CoSE-Bilkent)';
  }

  return layout;
};

module.exports = {
  layoutMap: layoutMap,
  defaultLayout: defaultLayout,
  layoutNames: layoutNames,
  getDefaultLayout: getDefaultLayout
};