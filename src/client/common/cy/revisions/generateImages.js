const { getLayouts } = require('../layout/');
const makeCytoscape = require('../');
const rearrangeGraph = require('./rearrangeGraph');

/* generateImages(layout, graph)
   Generate a collection of cytoscape images that represent the different applied layouts
   - Requires a valid layout list from the server and a valid cytoscape graph object
   - Layouts must be formatted as a object containing postions, dates, and ids
   - Graph must be a valid cytoscape json produced by cy.json();
*/
function generateImages(layouts, graph, options) {

  let pngCollection = layouts.map(layout => {
    return new Promise(resolve => {
      let positions = layout.positions;
      let layoutConf = getLayouts(positions);

      //Create a container since cytoscape can't render images without a dom to render to
      let container = document.createElement('div');
      container.id = layout.id;
      document.body.appendChild(container);

      //Make a cytoscape instance to render the png
      const cyHeadless = makeCytoscape({ container : document.getElementById(layout.id) });
      cyHeadless.add(graph);


      let formatOutput = image => {
        cyHeadless.destroy();
        var elem = document.getElementById(layout.id);
        elem.parentNode.removeChild(elem);
        return { id: layout.id, img: image, date: layout.date_added };
      };

      resolve(rearrangeGraph(layoutConf.layouts, positions, cyHeadless, true, options).then(formatOutput));
    });
  });

  return Promise.all(pngCollection);
}

module.exports = generateImages; 