const bindHover = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const bindClick = require('./click');

const bindEvents = (cy) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy);
};

module.exports = bindEvents;