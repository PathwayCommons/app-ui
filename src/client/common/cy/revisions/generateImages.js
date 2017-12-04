const apiCaller = require('../../../services/apiCaller/');

/* generateImages(layout, graph)
   Generate a collection of cytoscape images that represent the different applied layouts
   - Requires a valid layout list from the server and a valid cytoscape graph object
   - Layouts must be formatted as a object containing postions, dates, and ids
   - Graph must be a valid cytoscape json produced by cy.json();
*/
function generateImages(layouts, graph) {
  //console.log(graph, JSON.stringify(graph));
  //const cyHeadless = makeCytoscape({ headless : true });
  //cyHeadless.add(graph);
  //graph = cyHeadless.json().elements;
  graph = graph.nodes.concat(graph.edges);
  return apiCaller.renderPNG({layouts, graph});
}

module.exports = generateImages; 