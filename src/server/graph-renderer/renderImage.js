const cytosnap = require('cytosnap');
const getRenderOptions = require('./getRenderOptions');

/* renderImage (graphValues)
   Render a collection of images representing the most recent layouts
   - Requires a valid graphValues object which consists of a layouts field and a graph field
   - Returns a collection of PNGs in base64
*/
function renderImage(graphValues) {
  //Create a cytosnap object
  var snap = cytosnap();
  var layouts = graphValues.layouts;
  var graph = graphValues.graph;

  //Start Cytosnap Instance
  return snap.start().then(function () {
    //Create an array of images
    let images = layouts.map(layout => {

      //Build a render options object
      let renderJson = getRenderOptions(graph, layout.positions);

      //Generate an image of a layout. 
      return snap.shot(renderJson).then(res => ({
        id: layout.id,
        date: layout.date_added,
        img: res
      }));
    });

    return Promise.all(images);
  });
}

module.exports = renderImage; 