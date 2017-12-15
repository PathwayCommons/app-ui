const _ = require('lodash');

const defaults = {
  menuRadius: 80,
  fillColor: 'rgba(0, 0, 0, 0.75)',
  activeFillColor: 'rgba(1, 105, 217, 0.75)',
  activePadding: 10,
  indicatorSize: 12,
  separatorWidth: 3,
  minSpotlightRadius: 12,
  maxSpotlightRadius: 12,
  openMenuEvents: 'cxttapstart taphold',
  itemColor: 'white',
  itemTextShadowColor: 'transparent',
  zIndex: 9999,
  atMouse: false
};

const expandCollapse = generateCommand('settings_overscan', 'Expand/Collapse', ele => {
  ele.emit('hideTooltips');
  ele.emit('expandCollapse');
});
const getInfo = generateCommand('info_outline', 'More Info', ele =>  ele.emit('showTooltip'));

//Create a cxt menu command object
function generateCommand(icon, title, selectFunction) {
  return {
    content: '<i class="material-icons cxt-icon">' + icon + '</i> <div class="cxt-info">' + title + '</div>',
    select: selectFunction
  };
}

//Build a ctx options object
function getCtxOptions(commands, selector) {
  return _.assign({}, defaults, {
    selector: selector,
    commands: commands
  });
}
//Create a context menu instance and bind it to cy
function bindContextMenu(cy) {

  //Get options
  const complexNodeMenu = getCtxOptions([expandCollapse, getInfo], 'node[class="complex"]');
  const regularNodeMenu = getCtxOptions([getInfo], 'node[class!="complex"]');

  //Create context menus
  cy.cxtmenu(complexNodeMenu);
  cy.cxtmenu(regularNodeMenu);
}

module.exports = bindContextMenu;