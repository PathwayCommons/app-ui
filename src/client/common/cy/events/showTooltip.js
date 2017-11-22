
const MetadataTip = require('../../tooltips/metadataTip');

const bindShowTooltip = (cy) => {
  cy.on('showTooltip', 'node', function (evt) {
    let data = evt.target.data();
    let name = data.label;
    let cy = evt.cy;

    //Create or get tooltip HTML object
    let html = evt.target.scratch('_tooltip');
    if (!(html)) {
      html = new MetadataTip(name, data, evt.target);
      evt.target.scratch('_tooltip', html);
    }

    html.show(cy);
  });
};

module.exports = bindShowTooltip;