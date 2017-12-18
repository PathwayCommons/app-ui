const cytosnap = require('cytosnap');
const _ = require('lodash');
const getRenderOptions = require('./getRenderOptions');

/* renderImage (graphValues)
   Render a collection of images representing cytoscape graphs
   - Requires a valid graphValues object which consists of a layouts field and a graph field
   - Returns a collection of PNGs in base64
*/
function renderImage(graphValues) {
  //Create a cytosnap object
  var snap = cytosnap();
  var layouts = graphValues.layouts;
  var graph = graphValues.graph;

  if(!layouts || layouts.length <= 1) {return new Promise(r => r([]));}

  //Get all parent nodes
  let parents = graph.map(element => element.data.parent);
  parents = _.compact(parents);  // Remove false values
  parents = _.uniq(parents); //Delete duplicates

  //Start Cytosnap Instance
  return snap.start().then(function () {
    //Create an array of images
    let images = layouts.map(layout => {

      //Filter out parent nodes
      let layoutPositions = _.pickBy(layout.positions, (value, key) => !parents.includes(key)); 

      //Build a render options object
      let renderJson = getRenderOptions(graph, layoutPositions);

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