
const MetadataTip = require('../tooltips/');

const bindShowTooltip = (cy,showTooltipsOnEdges) => {
  const selector= 'node'+(showTooltipsOnEdges ?',edge':'');
  cy.on('showTooltip', selector, function (evt) {

    
    const node = evt.target;

    const data = node.data();
    const name = data.label;
    const cy = evt.cy;

    //if the selection is a compartment, do not display a tooltip
    if(data.class !== "compartment"){
      //Create or get tooltip HTML object
      let html = node.scratch('_tooltip');
      if (!(html)) {
        html = new MetadataTip(name, data, node);
        node.scratch('_tooltip', html);
      }
      html.show(cy);
    }
  });
};

module.exports = bindShowTooltip;