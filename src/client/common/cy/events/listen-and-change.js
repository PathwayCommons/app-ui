const { ServerAPI } = require('../../../services/');
const { applyHumanLayout } = require('../layout/');


// multi edit event listeners (when someone else edits the same network as you, you will receive their changes and vice versa)
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
    applyHumanLayout(cy, layoutJSON, { duration: 250 });
  });
};

module.exports = bindListenAndChange;