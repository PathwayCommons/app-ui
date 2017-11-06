const colaOpts = require('./cola');
const coseBilkentOpts = require('./coseBilkent');
const dagreOpts = require('./dagre');
const klayOpts = require('./klay');
const stratifiedLayeredOpts = require('./stratifiedKlay');

const coseBilkentMaxGraphSize = 100;

const layoutMap = new Map()
.set('Force Directed 1', coseBilkentOpts)
.set('Force Directed 2', colaOpts)
.set('Tree', dagreOpts)
.set('Layered', klayOpts)
.set('Stratified', stratifiedLayeredOpts);

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
    layout = 'Force Directed 1';
  }

  return layout;
};

module.exports = {layoutMap, defaultLayout, layoutNames, getDefaultLayout};