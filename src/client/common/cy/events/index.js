const bindHover = require('./hover');
const bindExpandCollapse = require('./expand-collapse');
const { bindClick } = require('./click');
const bindShowTooltip = require('./show-tooltip');

const bindEvents = (cy, callback) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
  bindShowTooltip(cy);
};

module.exports = bindEvents;