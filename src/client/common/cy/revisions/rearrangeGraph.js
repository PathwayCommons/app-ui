const apiCaller = require('../../../services/apiCaller/');

/* rearrangeGraph(layouts, positions, cy, headless, options)
Apply a human created layout and submit the changes to the server
Returns a PNG of the modified graph
Note : -Options Parameter is optional
       -Layouts is a collection of layouts
       -Positions is a collection of position objects 
*/
function rearrangeGraph(nodePositions, cy, options) {

  //Reset all positions to 0
  cy.nodes().forEach(node => node.position({x : 0, y : 0}));

  //Apply positions of moved nodes. 
  Object.keys(nodePositions).forEach(function (key) {
    let node = cy.getElementById(key);
    let position = nodePositions[key];
    node.position(position);

    if (options.admin) {
      apiCaller.submitNodeChange(options.uri, 'latest', key, position);
    }
  });

  //Animate zoom and fit
  cy.animate({
    fit: {
      eles: cy.elements(), padding: 100
    }
  }, { duration: 700 });
}

module.exports = rearrangeGraph; 