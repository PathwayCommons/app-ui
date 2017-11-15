const hoverStyles = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const bindClick = require('./click');

const bindEvents = (cy, callback) => {
  hoverStyles.bindHover(cy);
  bindExpandCollapse(cy);
  bindClick(cy, callback);
};

module.exports = bindEvents;