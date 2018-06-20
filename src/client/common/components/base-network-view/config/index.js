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

//This list of nodes is created from shift+drag box select.  See box-select.js
const hideSelectedNodes = (props) => {
  const cy = props.cy;
  let nodesToHide = cy.selectedNodesToHide;
  for(let i in nodesToHide){
    let node = nodesToHide[i];
    node.hide();
  }
};

//resets any nodes hidden with hideSelectedNodes
const showAllNodes = (props) => {
  const cy = props.cy;
  let nodes = cy.nodes();
  for(let i in nodes){
    let node = nodes[i];
    if(node.show)
      node.show();
  }
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
    description: 'Reset network arrangement'
  },
  {
    id:'hideSelected',
    icon:'replay',
    type: 'networkAction',
    func: hideSelectedNodes,
    description: 'Hide selected nodes (select with shift+drag)'
  },
  {
    id:'showAll',
    icon:'replay',
    type:'networkAction',
    func:showAllNodes,
    description: 'Show all nodes'
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
