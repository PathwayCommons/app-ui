const bindHover = require('./hover');
const bindExpandCollapse = require('./expand-collapse');
const { bindClick } = require('./click');
const bindShowTooltip = require('./show-tooltip');

const bindEvents = (cy,opts, callback) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
  bindShowTooltip(cy,opts.showTooltipsOnEdges);
};

module.exports = bindEvents;