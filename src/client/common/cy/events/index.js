const bindHover = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const bindClick = require('./click');
const bindShowTooltip = require('./showTooltip');
const bindCredits = require('./credits');

const bindEvents = (cy, callback) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
  bindShowTooltip(cy);
  bindCredits(cy);
};

module.exports = bindEvents;