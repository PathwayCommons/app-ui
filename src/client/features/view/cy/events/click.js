const createToolTip = require('../createToolTip');

const bindClick = (cy) => {
  //Tippy JS Events
  //Binding actions (Try/Catch blocks re only for quick demo purposes)
  //Bind right click event to tippy.show()
  cy.on('cxttap', 'node', function (evt) {
      let data = evt.target.data();
      let name = data.label;
      let html = new createToolTip(name, data, evt.target);
      html.show();
  });

  //Bind drag  event to tippy.hide()
  cy.on('drag', 'node', function (evt) {

  });

};

module.exports = bindClick;