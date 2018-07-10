
const MetadataTip = require('../tooltips/');

const bindShowTooltip = cy => {
  //TODO MAKE INTERACTIONS NOT USE THIS AND MAKE INTERACTIONS DEFINE ITS OWN TOOLTIP FUNCTIONALITY
  cy.on('showTooltip', 'node', function (evt) {
    const node = evt.target;
    const cy = evt.cy;

    if(node.data('class') !== "compartment"){
      //Create or get tooltip HTML object
      let tooltip = node.scratch('_tooltip');
      if (!(tooltip)) {
        tooltip = new MetadataTip(node);
        node.scratch('_tooltip', tooltip);
      }
      tooltip.show(cy);
    }
  });
};

module.exports = bindShowTooltip;