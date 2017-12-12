const apiCaller = require('../../../services/apiCaller/');
const rearrangeGraph = require('../revisions/rearrangeGraph.js');

const bindListenAndChange = cy => {
  apiCaller.initReceiveNodeChange(nodeDiff => {
    let node = cy.elements('node[id = "'+nodeDiff.nodeID+'"]');
    if (node.isChildless()) {
      node.animate({
        position: nodeDiff.bbox
      }, { duration: 250 });
    }
  });

  apiCaller.initReceiveLayoutChange(layoutJSON => {
    rearrangeGraph(layoutJSON, cy, { duration: 250 });
  });
};

module.exports = bindListenAndChange;