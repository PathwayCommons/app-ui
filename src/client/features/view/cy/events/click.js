const tippy = require('tippy.js');
const createToolTip = require('../createToolTip');

const bindClick = (cy) => {
  //Tippy JS Events
  //Binding actions (Try/Catch blocks re only for quick demo purposes)
  //Bind right click event to tippy.show()
  cy.on('cxttap', 'node', function (evt) {
      let data = evt.target.data();
      let name = data.label;
      let metadata = data.parsedMetadata;
      let refObject = evt.target.popperRef();
      let tooltip; 

      if(!tooltip){
        let tooltipHTML = createToolTip(name, data);
        tooltip = tippy(refObject, {html : tooltipHTML, theme : 'light', interactive : true});
      }

      tooltip.selector.dim = refObject.dim;
      tooltip.selector.cyElement = refObject.cyElement; 
      console.log(refObject);
      console.log(tooltip);
      tooltip.show(tooltip.store[0].popper);

  });

  //Bind drag  event to tippy.hide()
  cy.on('drag', 'node', function (evt) {

  });

};

module.exports = bindClick;