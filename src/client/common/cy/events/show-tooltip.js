const EntityMetadataTooltip = require('../tooltips/');

const bindShowTooltip = cy => {
  //TODO MAKE INTERACTIONS NOT USE THIS AND MAKE INTERACTIONS DEFINE ITS OWN TOOLTIP FUNCTIONALITY
  cy.on('showTooltip', 'node', function (evt) {
    const node = evt.target;

    if(node.data('class') !== "compartment"){
      //Create or get tooltip HTML object
      let tooltip = node.scratch('_tooltip');
      if (!(tooltip)) {
        tooltip = new EntityMetadataTooltip(node);
        node.scratch('_tooltip', tooltip);
      }
      tooltip.show();
    }
  });
};

module.exports = bindShowTooltip;