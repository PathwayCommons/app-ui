const tippy = require('tippy.js');

const bindClick = (cy) => {
  //Tippy JS Events
  //Binding actions (Try/Catch blocks re only for quick demo purposes)
  //Bind right click event to tippy.show()
  cy.on('cxttap', 'node', function (evt) {
      console.log(evt.target.data());
  });

  //Bind drag  event to tippy.hide()
  cy.on('drag', 'node', function (evt) {

  });

};

module.exports = bindClick;