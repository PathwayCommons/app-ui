const bindHover = require('./hover');
const { bindClick } = require('./click');
const bindShowTooltip = require('./show-tooltip');

const bindEvents = (cy, opts, callback) => {
  cy.expandCollapse({
    layoutBy: {
      name: 'cose-bilkent',
      nodeDimensionsIncludeLabels: true,
      tilingPaddingVertical: 20,
      tilingPaddingHorizontal: 20,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 75,
      randomize: true
    },
    animate: true,
    cueEnabled: false
  });
  bindHover(cy);
  bindClick(cy, callback);
  bindShowTooltip(cy,opts.showTooltipsOnEdges);
};

module.exports = bindEvents;