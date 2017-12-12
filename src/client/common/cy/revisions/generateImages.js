const { ServerAPI } = require('../../../services/');



/* generateImages(layout, graph)
   Generate a collection of cytoscape images that represent the different applied layouts
   - Requires a valid layout list from the server and a valid cytoscape graph object
   - Layouts must be formatted as a object containing postions, dates, and ids
   - Graph must be a valid cytoscape json produced by cy.json();
   - No images will be returned if there are no layouts. 
   - Images for every layout provided will be rendered, number of images is dependant on
     the number of layouts provided
*/

function generateImages(layouts, graph) {
  //Gather all elements in one array
  graph = graph.nodes.concat(graph.edges);

  /* Reconstruct array with only bounding box, id, source, and target for each element
  - This is needed as other data fields are not needed and tend to cause server side
    parse errors
  */
  graph = graph.map(item => ({
    data : {
      id : item.data.id,
      bbox : item.data.bbox,
      parent : item.data.parent,
      class : item.data.class,
      portSource : item.data.portSource,
      portTarget : item.data.portTarget,
      source : item.data.source,
      target : item.data.target
    }
  }));

  return ServerAPI.renderImages({layouts, graph});
}

module.exports = generateImages; 