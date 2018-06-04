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

/**
 * @description Hides all nodes that the user has selected
 */
const hideSelected = (props) => {
  const cy = props.cy;
  const nodeList = cy.nodes();
  const userSelectedElements = cy.userSelectedElements;

  //loop through all nodes in graph
  //if a match is found in the user-selected nodes, hide it
  for(let i in nodeList){
    let node = nodeList[i];
    if(!node.data)
      continue;
    if(userSelectedElements.includes(node.data()))
      node.hide();
  }
};

/**
 * @description Hides all nodes that the user has NOT selected
 */
const onlyShowSelected = (props) => {
  const cy = props.cy;
  const nodeList = cy.nodes();
  const userSelectedElements = cy.userSelectedElements;

  //First, hide every node in the graph
  for(let i in nodeList){
    let node = nodeList[i];
    if(!node.data)
      continue;
    node.hide();
  }

  //loop through the selected nodes, when a match has been found in the graph
  //show that entity and all it's children

  //TODO show partners if an interaction is selected
  for(let i in userSelectedElements){
    let userNode = userSelectedElements[i];
    for(let j in nodeList){
      let node = nodeList[j];
      if(!node.data)
        continue;
      if(userNode === node.data()){
        node.show();
        node.parents().show();
        showAllChildren(node);
      }
    }
  }
};

//helper function to show children of an entity
const showAllChildren = (node) => {
  if(node.children){
    const nodeChildren = node.children();
    nodeChildren.show();
    for(let x in nodeChildren){
      showAllChildren(nodeChildren[x]);
    }
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
    type:'networkAction',
    func:hideSelected,
    description:'Hide Selected Nodes',

  },
  {
    id:'onlyShowSelected',
    icon:'replay',
    type:'networkAction',
    func:onlyShowSelected,
    description:'Only Show Selected Nodex',

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
