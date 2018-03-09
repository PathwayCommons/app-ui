const h = require('react-hyperscript');

const { NetworkInfoMenu, FileDownloadMenu } = require('./menus');

let expanded = true;
const expandCollapseAll = (props) => {
  if (expanded) {
    props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
  } else {
    props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isCollapsed()).expand();
  }
  expanded = !expanded;
};

const fit = (props) => {
  props.cy.animation({ duration: 250, fit: { padding: 75 } }).play();
};

const resetToDefaultLayout = (props) => {
  const cy = props.cy;
  cy.layout(props.layoutConfig.defaultLayout.options).run();
};


// material icon name to func/description object
const toolbarButtons = [
  {
    id: 'showInfo',
    icon: 'info',
    type: 'activateMenu',
    menuId: 'networkInfoMenu',
    description: 'Extra information'
  },
  {
    id: 'showFileDownload',
    icon: 'file_download',
    type: 'activateMenu',
    menuId: 'fileDownloadMenu',
    description: 'Download options'
  },
  {
    id: 'expandCollapse',
    icon: 'select_all',
    type: 'networkAction',
    func: expandCollapseAll,
    description: 'Expand/Collapse all complex nodes'
  },
  {
    id: 'fit',
    icon: 'fullscreen',
    type: 'networkAction',
    func: fit,
    description: 'Fit network to screen'
  },
  {
    id: 'layout',
    icon: 'replay',
    type: 'networkAction',
    func: resetToDefaultLayout,
    desc: 'Reset network arrangement'
  }
];

// todo turn this into a map
// create a null entry for the close menu

const menus = [
  {
    id: 'closeMenu',
    func: props => null
  },
  {
    id: 'fileDownloadMenu',
    func: props => h(FileDownloadMenu, props),
  },
  {
    id: 'networkInfoMenu',
    func: props => h(NetworkInfoMenu, props),
  }
];


module.exports = {
  toolbarButtons,
  menus
};
