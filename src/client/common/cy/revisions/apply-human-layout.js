const { ServerAPI } = require('../../../services/');

function applyHumanLayout(nodePositions, cy, options = {}) {

  //Reset all positions to 0
  cy.nodes().forEach(node => node.position({x : 0, y : 0}));

  //Apply positions of moved nodes. 
  Object.keys(nodePositions).forEach(function (key) {
    let node = cy.getElementById(key);
    let position = nodePositions[key];

    if(node.isParent()) {return;}

    node.position(position);

    if (options.admin) {
      ServerAPI.submitNodeChange(options.uri, 'latest', key, position);
    }
  });

  const duration = options.duration || 700;

  //Animate zoom and fit
  cy.animate({
    fit: {
      eles: cy.elements(), padding: 100
    }
  }, { duration: duration });
}

module.exports = applyHumanLayout; 