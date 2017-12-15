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
  props.cy.fit(null, 100);
};

const resetToDefaultLayout = (props) => {
  const cy = props.cy;
  cy.layout(props.layoutConfig.defaultLayout.options).run();
};


const menuButtons = {
  info: 'Extra information',
  file_download: 'Download options',
};

// material icon name to func/description object
const networkButtons = {
  select_all: {
    func: expandCollapseAll,
    description: 'Expand/Collapse all complex nodes'
  },
  fullscreen: {
    func: fit,
    description: 'Fit network to screen'
  },
  replay: {
    func: resetToDefaultLayout,
    desc: 'Reset network arrangement'
  }
};


module.exports = { networkButtons, menuButtons };