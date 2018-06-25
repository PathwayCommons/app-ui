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

const showOnlySelected = (props) => {
  const cy = props.cy;
  let nodesToKeep = cy.$(':selected');
  let nodes = cy.nodes();
  for(let n in nodes){
    let node = nodes[n];
    //make sure its a real node
    if(node.show)
      if(node.data().class !== "compartment" && checkNodes(node,nodesToKeep))
        node.hide();
  }
};

//This list of nodes is created from shift+drag box select.  See box-select.js
const hideSelectedNodes = (props) => {
  const cy = props.cy;
  let nodesToHide = cy.$(':selected');
  for(let i in nodesToHide){
    let node = nodesToHide[i];
    if(node.hide){ node.hide(); }
  }
};

//resets any nodes hidden with hideSelectedNodes
const showAllNodes = (props) => {
  const cy = props.cy;
  let nodes = cy.nodes();
  let edges = cy.edges();
  for(let n in nodes){
    let node = nodes[n];
    if(node.show)
      node.show();
  }
  for(let e in edges){
    let edge = edges[e];
    if(edge.show)
      edge.show();
  }
};

const checkNodes = (nodeToHide, nodesToKeep) => {
  for(let n in nodesToKeep){
    let node = nodesToKeep[n];
    if(nodeToHide === node)
      return false;
  }
  return true;
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
    icon:'visibility_off',
    type: 'networkAction',
    func: hideSelectedNodes,
    description: 'Hide selected nodes (select with shift+drag)'
  },
  {
    id:'showOnly',
    icon:'visibility',
    type:"networkAction",
    func:showOnlySelected,
    description:'Show only selected nodes (select with shift+drag)'
  },
  {
    id:'showAll',
    icon:'autorenew',
    type:'networkAction',
    func:showAllNodes,
    description: 'Show all nodes'
  },
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
