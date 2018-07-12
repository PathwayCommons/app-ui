const h = require('react-hyperscript');

const { NetworkInfoMenu, FileDownloadMenu } = require('./menus');

let expanded = true;
const expandCollapseAll = (props) => {
  let cy = props.cy;
  let api = cy.expandCollapse('get');

  if (expanded) {
    let nodesToCollapse = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isCollapsible(node));
    api.collapse(nodesToCollapse);

  } else {
    let nodesToExpand = cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => api.isExpandable(node));
    api.expand(nodesToExpand);
  }
  expanded = !expanded;
};

const fit = (props) => {
  props.cy.animation({ duration: 250, fit: { padding: 75 } }).play();
};

const resetToDefaultLayout = (props) => {
  const cy = props.cy;
  showAllNodes(props);
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
        node.addClass('hidden');
  }
};

//This function hides all nodes which are currently selecting with box select
const hideSelectedNodes = (props) => {
  const cy = props.cy;
  //get selected nodes
  let nodesToHide = cy.$(':selected');
  //hide everything in the list
  for(let i in nodesToHide){
    let node = nodesToHide[i];
    if(node.hide){ node.addClass('hidden'); }
  }
};

//resets any nodes hidden with hideSelectedNodes or showOnlySelected
const showAllNodes = (props) => {
  const cy = props.cy;
  //get all nodes and edges in graph
  let nodes = cy.nodes();
  let edges = cy.edges();
  //show all nodes which have been hidden
  for(let n in nodes){
    let node = nodes[n];
    if(node.show && node.hasClass('hidden'))
      node.removeClass('hidden');
  }
  //show all edges which have been hidden
  for(let e in edges){
    let edge = edges[e];
    if(edge.show && edge.hasClass('hidden'))
      edge.removeClass('hidden');
  }
};

//equivalent to indexOf() === -1 for Collection
//helper function for showOnlySelected
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
    id: 'layout',
    icon: 'refresh',
    type: 'networkAction',
    func: resetToDefaultLayout,
    description: 'Reset network arrangement'
  },
];

// todo turn this into a map
// create a null entry for the close menu

const menus = [
  {
    id: 'closeMenu',
    func: () => null
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
