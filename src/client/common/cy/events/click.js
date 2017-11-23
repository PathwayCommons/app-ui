//Hide all Tooltips
//Requires a valid cytoscape element
const hideTooltips = (cy) => {
  cy.elements().each(function (element) {
    var tempElement = element.scratch('_tooltip');
    if (tempElement && tempElement.isVisible()) { tempElement.hide(); }
  });
  incrementClicks(cy, true);
};

//Increment click counter and return new counter value
//Requires a valid cytoscape element
//Note : Optional reset parameter set the counter to 0
const incrementClicks = (cy, reset) => {
  if (reset){
    cy.scratch('_clicks', 0);
    return 0;
  }
  else {
    let clicks = cy.scratch('_clicks');
    if (Number.isInteger(clicks)) { clicks++; }
    else clicks = 0;
    cy.scratch('_clicks', clicks);
    return clicks;
  }
};

const bindClick = (cy) => {
  //Click Handler
  //Manage Single and Double Click Events
  cy.on('tap', evt => {
    const cy = evt.cy;
    const target = evt.target;
    const timeout = 300;

    //Click executed on core
    //Hide all tool tips
    if (evt.target == evt.cy) {
      hideTooltips(cy);
      return;
    }

    //Hide tooltip if tooltip is visible
    var tempElement = target.scratch('_tooltip');
    if (tempElement && tempElement.isVisible()) {
      tempElement.hide();
      incrementClicks(cy, true);
      return;
    }

    let clicks = incrementClicks(cy);

    //Pause and wait for any additional clicks
    if (clicks == 1) {
      setTimeout(() => {
        clicks = cy.scratch('_clicks');

        //Display Tooltip
        if (clicks == 1) {
          hideTooltips(cy);
          evt.target.emit('showTooltip');
        }
        //Expand Collapse
        else if (clicks != 0) {
          hideTooltips(cy);
          evt.target.emit('expandCollapse');
        }

        //Reset clicks
        incrementClicks(cy, true);

      }, timeout);
    }
  });

  //Hide Tooltips on various graph movements
  cy.on('drag', evt => hideTooltips(evt.cy));
  cy.on('pan', evt => hideTooltips(evt.cy));
  cy.on('zoom', evt => hideTooltips(evt.cy));
};

module.exports = bindClick;