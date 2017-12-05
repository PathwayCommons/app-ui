const apiCaller = require('../../../services/apiCaller/');

/* generateImages(layout, graph)
   Generate a collection of cytoscape images that represent the different applied layouts
   - Requires a valid layout list from the server and a valid cytoscape graph object
   - Layouts must be formatted as a object containing postions, dates, and ids
   - Graph must be a valid cytoscape json produced by cy.json();
   - No images will be returned if there are no layouts. 
*/
function generateImages(layouts, graph) {
  graph = graph.nodes.concat(graph.edges);
  return apiCaller.renderImages({layouts, graph});
}

module.exports = generateImages; 