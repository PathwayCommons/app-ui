const { ServerAPI } = require('../../../services/');
const { applyHumanLayout } = require('../revisions/');

const bindListenAndChange = cy => {
  ServerAPI.initReceiveNodeChange(nodeDiff => {
    let node = cy.elements('node[id = "'+nodeDiff.nodeID+'"]');
    if (node.isChildless()) {
      node.animate({
        position: nodeDiff.bbox
      }, { duration: 250 });
    }
  });

  ServerAPI.initReceiveLayoutChange(layoutJSON => {
    applyHumanLayout(layoutJSON, cy, { duration: 250 });
  });
};

module.exports = bindListenAndChange;