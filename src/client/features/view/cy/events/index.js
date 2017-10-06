const bindHover = require('./hover');
const bindExpandCollapse = require('./expandCollapse');
const bindMove = require('./move');
const bindClick = require('./click');

const bindEvents = (cy) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindMove(cy);
  bindClick(cy);
};

module.exports = bindEvents;