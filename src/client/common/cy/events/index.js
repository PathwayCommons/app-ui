const bindHover = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const { bindClick } = require('./click');
const bindShowTooltip = require('./showTooltip');

const bindEvents = (cy, callback) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
  bindShowTooltip(cy);
};

module.exports = bindEvents;