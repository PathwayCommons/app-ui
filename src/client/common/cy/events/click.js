//Hide all Tooltips
//Requires a valid cytoscape element
const hideTooltips = (cy) => {
  cy.elements().forEach(ele => {
    const tooltip = ele.scratch('_tooltip');
    if (tooltip) { 
      tooltip.hide(); 
      ele.scratch('_tooltip-opened', false);
    }
  });
};

const userSelectedElements = [];

const bindClick = (cy) => {

  cy.on('tap', evt => {
    const cy = evt.cy;
    const ele = evt.target;

    if(ele.data){
      const data = ele.data();
      if(data && userSelectedElements.indexOf(data) === -1){
        userSelectedElements.push(ele.data());
      }
    }

    cy.userSelectedElements = userSelectedElements;

    if (!ele.scratch('_tooltip-opened')) {
      hideTooltips(cy);	
      ele.emit('showTooltip');
      ele.scratch('_tooltip-opened', true);
    } 
    else if(ele===cy){
      hideTooltips(cy);	 
    }
    else {
      hideTooltips(cy);
      ele.scratch('_tooltip-opened', false);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', evt => hideTooltips(evt.cy));
  cy.on('pan', evt => hideTooltips(evt.cy));
  cy.on('zoom', evt => hideTooltips(evt.cy));
};

module.exports = { bindClick, hideTooltips };