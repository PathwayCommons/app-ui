const bindHover = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const bindClick = require('./click');

const bindEvents = (cy, callback) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
};

module.exports = bindEvents;